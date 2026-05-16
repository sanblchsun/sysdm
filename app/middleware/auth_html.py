from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import RedirectResponse


class AuthHTMLMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # не трогаем login, static, api
        if (
            path.startswith("/api")
            or path.startswith("/static")
            or path in ("/login", "/logout")
        ):
            return await call_next(request)

        # Продлеваем сессию на любом запросе (не только HTML)
        from app.core.authx import auth, auth_config

        if auth_config.has_location("cookies"):
            from authx.exceptions import AuthXException
            import contextlib

            with contextlib.suppress(AuthXException, Exception):
                token = await auth.get_access_token_from_request(request)
                payload = auth.verify_token(token, verify_csrf=False)
                if payload.time_until_expiry < auth_config.JWT_IMPLICIT_REFRESH_DELTATIME:
                    new_token = auth.create_access_token(uid=payload.sub, fresh=False)
                    response = await call_next(request)
                    auth.set_access_cookies(new_token, response)
                    return response

        response = await call_next(request)

        # Редирект на логин только для HTML-страниц
        if request.headers.get("accept", "").find("text/html") == -1:
            return response

        try:
            token = await auth.get_access_token_from_request(request)
            auth.verify_token(token, verify_csrf=False)
        except Exception:
            return RedirectResponse("/login", status_code=302)

        return response
