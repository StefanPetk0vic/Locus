import { IsString, IsEnum, MinLength, IsEmail, IsOptional, Matches } from 'class-validator';
import { UserRole } from '../../user/user.entity';

export class AuthCredentialsDTO {
    @IsEmail()
    email: string;

    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
    @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
    @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
    @Matches(/(?=.*[!@#$%^&*.,])/, { message: 'Password must contain at least one special character' })
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    // @IsEnum(UserRole)
    // @IsOptional()
    // role: UserRole;

    @IsOptional()
    @IsString()
    licensePlate?: string;

}


export class LoginCredentialsDTO {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}