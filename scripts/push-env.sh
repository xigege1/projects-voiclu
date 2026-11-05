#!/usr/bin/env bash
# 把 .env.local 里的变量批量推到 Vercel 生产环境
# 用法：bash scripts/push-env.sh [env文件路径]
# 前提：本机已登录 vercel（npx vercel whoami 能返回账号）
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

ENV_FILE="${1:-.env.local}"
[ -f "$ENV_FILE" ] || { echo "找不到 $ENV_FILE，请先复制 .env.example 为 .env.local 并填值"; exit 1; }

ok=0; skip=0; fail=0
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue ;; esac
  case "$line" in *=*) ;; *) continue ;; esac

  key="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"

  if [ -z "$val" ]; then
    echo "-  跳过 $key（值为空）"
    skip=$((skip + 1))
    continue
  fi

  if printf '%s' "$val" | npx --yes vercel@latest env add "$key" production >/dev/null 2>&1; then
    echo "+  $key"
    ok=$((ok + 1))
  else
    npx --yes vercel@latest env rm "$key" production --yes >/dev/null 2>&1
    if printf '%s' "$val" | npx --yes vercel@latest env add "$key" production >/dev/null 2>&1; then
      echo "+  $key（已覆盖旧值）"
      ok=$((ok + 1))
    else
      echo "!  $key 失败，请手动添加"
      fail=$((fail + 1))
    fi
  fi
done < "$ENV_FILE"

echo "----------------------------------------"
echo "成功 $ok / 跳过 $skip / 失败 $fail"
[ "$ok" -gt 0 ] && echo "下一步必须重新部署：npx vercel deploy --prod --yes"
exit 0
