# env_check.py
import sys, os, shutil, subprocess, json

def headline(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)

def which(cmd):
    try:
        return shutil.which(cmd)
    except Exception:
        return None

def run(cmd):
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=True, text=True)
        return out.strip()
    except subprocess.CalledProcessError as e:
        return f"[ERROR]\n{e.output.strip()}"

def check_python():
    headline("① Python 基本信息")
    print(f"sys.version      : {sys.version.split()[0]}")
    print(f"sys.executable   : {sys.executable}")
    w = which("python")
    print(f"which('python')  : {w or 'NOT FOUND'}")
    if os.name == "nt":
        w3 = which("python3")
        print(f"which('python3') : {w3 or 'NOT FOUND'}")
    print(f"cwd              : {os.getcwd()}")

def check_alias_and_path():
    headline("② Windows 应用执行别名 / PATH 排序检测")
    if os.name != "nt":
        print("非 Windows，跳过别名检测。")
        return

    path = os.environ.get("PATH", "")
    paths = path.split(";")
    # 记录 WindowsApps 与 真实 Python 目录位置
    windows_apps_idx = [i for i, p in enumerate(paths) if "WindowsApps" in p]
    python_idx = [i for i, p in enumerate(paths) if ("Python" in p and ("\\Python" in p or p.endswith("\\Scripts"))) ]

    print("PATH 条目（前 12 项）：")
    for i, p in enumerate(paths[:12]):
        print(f"  [{i:02d}] {p}")

    if windows_apps_idx:
        print(f"\n⚠️  检测到 WindowsApps 目录在 PATH 中：索引 {windows_apps_idx}")
        print("   如果它在真实 Python 路径之前，可能会劫持 `python` 命令并跳转到 Microsoft Store。")
        print("   打开：设置 → 隐私和安全性 → 开发者选项 → 应用执行别名，将 python.exe / python3.exe 关闭。")

    if not python_idx:
        print("\n⚠️  没在 PATH 中发现明显的 Python 安装路径（如 Python312、Scripts）。")
        print("   建议把类似以下目录加入 PATH（版本号以你的实际为准）：")
        print(r"   C:\Users\<你>\AppData\Local\Programs\Python\Python312")
        print(r"   C:\Users\<你>\AppData\Local\Programs\Python\Python312\Scripts")
    else:
        print(f"\n✅ 检测到可能的 Python 路径索引：{python_idx}")

def check_pip():
    headline("③ pip 状态")
    out = run("python -m pip --version")
    print(out)

def ensure_packages(auto_install=False):
    headline("④ 依赖检查：requests / faker")
    missing = []
    for pkg in ["requests", "faker"]:
        try:
            __import__(pkg if pkg != "faker" else "faker")
            print(f"✅ {pkg} 已安装")
        except Exception:
            print(f"❌ 缺少 {pkg}")
            missing.append(pkg)

    if missing and auto_install:
        print("\n开始安装缺失依赖：", ", ".join(missing))
        cmd = f"python -m pip install {' '.join(missing)}"
        print(f"$ {cmd}")
        print(run(cmd))
    elif missing:
        print("\n提示：运行下面命令可自动安装缺失依赖：")
        print(f"python env_check.py --install")

def test_network_to_api():
    headline("⑤ 可选：连通性快速测试（本地 API）")
    import urllib.request, urllib.error
    url = "http://localhost:3000/api"
    try:
        with urllib.request.urlopen(url, timeout=3) as resp:
            data = resp.read(2000)
            print(f"✅ 访问 {url} 成功，状态码 {resp.status}，前 2000 字节：\n{data.decode('utf-8','ignore')}")
    except urllib.error.URLError as e:
        print(f"⚠️ 无法访问 {url}：{e}")

def main():
    auto_install = "--install" in sys.argv
    check_python()
    check_alias_and_path()
    check_pip()
    ensure_packages(auto_install=auto_install)
    # 可选：如果你的 Node API 已经在 3000 端口运行，取消下一行注释测试连通性
    try:
        test_network_to_api()
    except Exception as e:
        print(f"[跳过连通性测试] {e}")

    headline("✅ 建议后续操作")
    print("1) 若上面提示关闭应用执行别名：请按提示关闭后，重新打开一个新的终端。")
    print("2) 若缺少依赖并且未自动安装：执行  python env_check.py --install")
    print("3) 依赖就绪后，保持 `npm start` 运行，另开终端进入 database_scripts：")
    print('   python dbClean.py -u "localhost" -p 3000')
    print('   python dbFill.py  -u "localhost" -p 3000 -n 20 -t 100')
    print("4) 浏览器验证：")
    print("   http://localhost:3000/api/users?count=true")
    print("   http://localhost:3000/api/tasks?count=true")

if __name__ == "__main__":
    main()
