# TEA-EXT Extension Guide

## Giới thiệu
Thư mục `.tea-ext` được sử dụng để chứa các extension private được upload lên hệ thống Gitea. 

## Cấu trúc
Thư mục này có cấu trúc tương tự như thư mục `extensions` chính nhưng được tách biệt để phục vụ mục đích quản lý các bản phân phối private hoặc thử nghiệm trên server Gitea.

- `.tea-ext/plugin.json`: Quản lý danh mục các extension trong thư mục này.
- `.tea-ext/extensions/`: Chứa mã nguồn của từng extension.

## Quy trình làm việc
1. Các extension trong này thường được đóng gói và upload lên Gitea.
2. Việc đồng bộ hóa được thực hiện thông qua các tool trong `tools/cli`.

## Lưu ý
Không commit các thông tin nhạy cảm của server Gitea vào repository công khai.
