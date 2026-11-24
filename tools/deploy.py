# 바뀐 파일만 GitHub 저장소에 올립니다(GitHub Pages 배포용). git 없이 GitHub CLI(gh)만 씁니다.
# 사용법: python -I tools/deploy.py <계정>/<저장소> [--dry-run]      (프로젝트 폴더에서 실행)
#   --dry-run  무엇이 올라갈지와 버전만 보여 주고, 파일을 고치거나 올리지 않습니다.
# 버전: 앱에 보이는 파일이 바뀌었는데 app.js의 VERSION이 올라가 있는 것과 같으면,
#       끝자리를 하나 올리고 날짜를 오늘로 바꾼 뒤 올립니다(sw.js의 CACHE 이름도 함께).
import base64
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

if not sys.stdout.isatty():   # 출력을 파일·다른 프로그램으로 넘길 때 한글이 깨지거나 멈추지 않도록
    sys.stdout.reconfigure(encoding="utf-8")
repo = sys.argv[1]
dry = "--dry-run" in sys.argv[2:]
root = os.getcwd()
VER_RE = re.compile(r"var VERSION = '(\d+)\.(\d+)\.(\d+)', VERSION_DATE = '([\d-]+)';")
CACHE_RE = re.compile(r"var CACHE = '[^']*';")


def read_text(path):
    with open(os.path.join(root, path), encoding="utf-8", newline="") as f:
        return f.read()


def write_text(path, text):
    with open(os.path.join(root, path), "w", encoding="utf-8", newline="") as f:
        f.write(text)


def version_of(app_js):
    m = VER_RE.search(app_js)
    return (".".join(m.groups()[:3]), m.group(4)) if m else (None, None)


def set_version(ver, date):
    app = read_text("app.js")
    app = VER_RE.sub("var VERSION = '%s', VERSION_DATE = '%s';" % (ver, date), app, count=1)
    write_text("app.js", app)
    sw = read_text("sw.js")
    write_text("sw.js", CACHE_RE.sub("var CACHE = 'twko-%s';" % ver, sw, count=1))


def served(path):
    # 휴대폰에서 여는 앱에 쓰이는 파일인가(설명 문서·도구는 버전과 상관없다)
    return not (path.startswith("tools/") or path.endswith((".md", ".bat", ".py", ".txt")) or path == ".nojekyll")
SKIP_DIRS = {"raw", ".claude", ".git", "__pycache__", "design"}   # design: 로고 시안 등 확정 전 초안
BIG_LAST = "data/cedict-data.js"


def gh(args, body=None):
    cmd = ["gh", "api"] + args
    tmp = None
    if body is not None:
        fd, tmp = tempfile.mkstemp(suffix=".json")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(body, f)
        cmd += ["--input", tmp]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    finally:
        if tmp:
            os.remove(tmp)
    return r.returncode, r.stdout, r.stderr


def blob_sha(data):
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


local = []
for d, dirs, files in os.walk(root):
    dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
    for name in files:
        local.append(os.path.relpath(os.path.join(d, name), root).replace("\\", "/"))
local.sort(key=lambda p: (p == BIG_LAST, p))

code, out, err = gh([f"repos/{repo}"])
if code != 0:
    print("FAILED: repository not found:", repo, err.strip()[:200])
    sys.exit(1)
branch = json.loads(out).get("default_branch") or "main"

code, out, _ = gh([f"repos/{repo}/git/trees/{branch}?recursive=1"])
remote = {t["path"]: t["sha"] for t in json.loads(out).get("tree", [])} if code == 0 else {}


def local_sha(path):
    with open(os.path.join(root, path), "rb") as f:
        return blob_sha(f.read())


# ---------- 버전 확인 ----------
ver, ver_date = version_of(read_text("app.js"))
if not ver:
    print("FAILED: app.js에서 VERSION 줄을 찾지 못했습니다.")
    sys.exit(1)
if "var CACHE = 'twko-%s';" % ver not in read_text("sw.js"):   # sw.js 이름이 어긋나 있으면 맞춘다
    print("sw.js의 CACHE 이름을 버전 %s에 맞춥니다." % ver)
    if not dry:
        set_version(ver, ver_date)
app_changes = [p for p in local if served(p) and remote.get(p) != local_sha(p)]
if app_changes and "app.js" in remote:
    code, out, _ = gh([f"repos/{repo}/contents/app.js?ref={branch}"])
    remote_ver = version_of(base64.b64decode(json.loads(out)["content"]).decode("utf-8"))[0] if code == 0 else None
    if remote_ver == ver:
        major, minor, patch = ver.split(".")
        new_ver, today = "%s.%s.%d" % (major, minor, int(patch) + 1), datetime.date.today().isoformat()
        print("바뀐 파일이 있는데 버전이 %s 그대로라서 %s (%s)로 올립니다." % (ver, new_ver, today))
        if not dry:
            set_version(new_ver, today)
        ver, ver_date = new_ver, today
print("버전 %s (%s)" % (ver, ver_date))
if dry:
    todo = [p for p in local if remote.get(p) != local_sha(p)]
    print("올라갈 파일 %d개:" % len(todo), ", ".join(todo[:40]) + (" …" if len(todo) > 40 else ""))
    print("(--dry-run: 아무것도 고치거나 올리지 않았습니다)")
    sys.exit(0)

changed = 0
for path in local:
    with open(os.path.join(root, path), "rb") as f:
        data = f.read()
    if remote.get(path) == blob_sha(data):
        continue
    body = {"message": ("Update " if path in remote else "Add ") + path,
            "content": base64.b64encode(data).decode("ascii")}
    if path in remote:
        body["sha"] = remote[path]
    code, out, err = gh(["-X", "PUT", f"repos/{repo}/contents/{path}"], body)
    if code != 0:
        print("FAILED", path, err.strip()[:300])
        sys.exit(1)
    changed += 1
    print("uploaded", path, len(data))

print("done:", changed, "file(s) uploaded,", len(local) - changed, "unchanged")
print("올린 버전: %s (%s) — 휴대폰 사전 첫 화면 맨 아래에 이 번호가 보이면 새 버전입니다." % (ver, ver_date))

# GitHub Pages(휴대폰에서 여는 주소)가 꺼져 있으면 켠다.
code, out, _ = gh([f"repos/{repo}/pages"])
if code != 0:
    code, out, err = gh(["-X", "POST", f"repos/{repo}/pages"], {"source": {"branch": branch, "path": "/"}})
    if code != 0:
        print("FAILED to enable GitHub Pages:", err.strip()[:300])
        sys.exit(1)
    print("GitHub Pages enabled")
owner, name = repo.split("/")
print("URL: https://%s.github.io/%s/" % (owner.lower(), name))
