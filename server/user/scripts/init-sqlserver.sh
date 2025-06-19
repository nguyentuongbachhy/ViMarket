#!/bin/bash

# Đợi SQL Server khởi động và chạy
sleep 30s

# Xác định đường dẫn đúng cho sqlcmd
if [ -f "/opt/mssql-tools/bin/sqlcmd" ]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
elif [ -f "/opt/mssql/bin/sqlcmd" ]; then
  SQLCMD="/opt/mssql/bin/sqlcmd"
else
  echo "sqlcmd not found. Using direct T-SQL via /opt/mssql/bin/mssql-cli if available"
  SQLCMD="/opt/mssql/bin/mssql-cli -S localhost -U sa -P Ntbh08032004@sqlserver -Q"
fi

# Chạy script khởi tạo database
$SQLCMD -S localhost -U sa -P Ntbh08032004@sqlserver -i /docker-entrypoint-initdb.d/init-userdb.sql

echo "SQL Server database initialization completed!"