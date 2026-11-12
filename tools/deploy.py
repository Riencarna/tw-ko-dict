# 바뀐 파일만 GitHub 저장소에 올립니다(GitHub Pages 배포용). git 없이 GitHub CLI(gh)만 씁니다.
# 사용법: python -I tools/deploy.py <계정>/<저장소>      (프로젝트 폴더에서 실행)
import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile

repo = sys.argv[1]
root = os.getcwd()
SKIP_DIRS = {"raw", ".claude", ".git", "__pycache__"}
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
