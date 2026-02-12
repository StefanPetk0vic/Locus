import { Body, Controller, Post, ValidationPipe, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDTO, LoginCredentialsDTO } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('/register')
  async signUp(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDTO): Promise<void> {
    this.logger.log(`Register attempt for username: ${authCredentialsDto.email}`);
    const result = await this.authService.register(authCredentialsDto);
    this.logger.log(`User registered successfully: ${authCredentialsDto.email}`);
    return result;
  }

  @Post('/login')
  async signIn(@Body(ValidationPipe) loginCredentialsDto: LoginCredentialsDTO): Promise<{ accessToken: string }> {
    this.logger.log(`Login attempt for username: ${loginCredentialsDto.email}`);
    const result = await this.authService.login(loginCredentialsDto);
    this.logger.log(`User logged in successfully: ${loginCredentialsDto.email}`);
    return result;
  }
}