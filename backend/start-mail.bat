@echo off
set MAIL_ENABLED=true
set MAIL_HOST=smtp.gmail.com
set MAIL_PORT=587
set MAIL_USERNAME=adminrvrwb@gmail.com
set MAIL_PASSWORD=irin aewx hece rkdn
set MAIL_FROM=adminrvrwb@gmail.com
set MAIL_DISPLAY_NAME=RWB Project Review System
set MAIL_VERIFY_URL=http://localhost:5173/verify-email
cd /d D:\RWB\rwb\backend
java -jar target\rwb-review-backend-0.1.0-SNAPSHOT.jar
