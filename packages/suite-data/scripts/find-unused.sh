find . -path "**/suite*/src/*" -not -path "**/node_modules/*" \( -name "*.ts" -or -name "*.tsx" \) -not -name "messages.ts" -not -name "*.test.*" -exec grep -nH --color=auto $1 {} ';' -quit;
