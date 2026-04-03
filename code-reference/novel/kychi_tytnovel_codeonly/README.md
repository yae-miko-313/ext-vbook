# kychi_tytnovel

Extension nay ho tro 2 luong request song song:

- app-default: dung header client mac dinh cua app.
- user-config: user tu them cookie/header ca nhan (neu nguon yeu cau dang nhap).

## 1) Cac bien cau hinh ho tro

Ban co the dat cac bien sau trong moi truong runtime cua extension:

- CONFIG_URL
- CONFIG_API_BASE
- CONFIG_API_BASES
- CONFIG_CLIENT_ID
- CONFIG_CLIENT_TOKEN
- CONFIG_CLIENT_VERSION
- CONFIG_CLIENT_PLATFORM
- CONFIG_CLIENT_LANGUAGE
- CONFIG_AUTH_MODE
- CONFIG_USER_COOKIE
- CONFIG_USER_AUTHORIZATION
- CONFIG_USER_HEADERS

## 2) Luong app-default (mac dinh)

Khong can dat them bien nao. Extension se tu dung:

- host fallback: https://tata.noveltyt.app, https://api.noveltyt.app
- header client mac dinh: client-id/token/platform/version/language/uuid

Neu request bi 403/401, extension se hien thong bao goi y sang mode user-config.

## 3) Luong user-config (user tu cau hinh)

### Buoc 1: bat mode user

- CONFIG_AUTH_MODE = "user"

### Buoc 2: chen cookie phien dang nhap (khuyen nghi)

- CONFIG_USER_COOKIE = "name1=value1; name2=value2; ..."

### Buoc 3: neu can, chen Authorization

- CONFIG_USER_AUTHORIZATION = "Bearer <token>"

### Buoc 4: neu server can them header dac thu

- CONFIG_USER_HEADERS = "x-header-1: value\nx-header-2: value"

Luu y:

- Moi header mot dong, dung dinh dang key: value.
- Khong de khoang trang du dau dong.
- Cookie/token het han se can cap nhat lai.

## 4) Tuy chinh host/API

- Mot host: CONFIG_API_BASE = "https://api.noveltyt.app"
- Nhieu host fallback: CONFIG_API_BASES = "https://tata.noveltyt.app,https://api.noveltyt.app"

Extension se bo phan /api/v2 neu ban paste du URL day du, vi script tu ghep lai theo version noi bo.

## 5) Kiem tra nhanh

- Mo home/search/detail neu du lieu len binh thuong la ok.
- Neu thay thong bao 403/401, kiem tra lai cookie/token/header mode user.
- Thu doi host trong CONFIG_API_BASES neu mot host bi chan tam thoi.
