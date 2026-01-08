import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean{
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user && user.is_admin) {
            return true;
        }
        throw new ForbiddenException('Access denied, Admin only');
    }
}