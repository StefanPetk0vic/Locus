import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDTO, LoginCredentialsDTO } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  signUp(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDTO): Promise<void> {
    return this.authService.register(authCredentialsDto);
  }

  @Post('/login')
  signIn(@Body(ValidationPipe) loginCredentialsDto: LoginCredentialsDTO): Promise<{ accessToken: string }> {
    return this.authService.login(loginCredentialsDto);
  }
}