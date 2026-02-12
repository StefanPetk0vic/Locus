import { Controller, Get, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from './infrastructure/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { AdminGuard } from '../auth/admin.guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/profile')
    getProfile(@GetUser() user: User) {
        return user;
    }

    @Patch('/:id/ban')
    @UseGuards(AdminGuard)
    async banUser(@Param('id') id: string) {
        await this.userService.banUser(id);
        return { message: 'User banned successfully' };
    }

    @Patch('/drivers/:id/verify')
    @UseGuards(AdminGuard)
    async verifyDriver(@Param('id') id: string) {
        const driver = await this.userService.verifyDriver(id);
        return { message: 'Driver verified successfully', driver };
    }

    @Patch('/drivers/:id/unverify')
    @UseGuards(AdminGuard)
    async unverifyDriver(@Param('id') id: string) {
        const driver = await this.userService.unverifyDriver(id);
        return { message: 'Driver unverified', driver };
    }

    @Patch('/drivers/:id/license-plate')
    async updateLicensePlate(
        @Param('id') id: string,
        @Body('licensePlate') licensePlate: string,
    ) {
        const driver = await this.userService.updateDriverLicensePlate(id, licensePlate);
        return { message: 'License plate updated', driver };
    }

    @Get('/drivers')
    @UseGuards(AdminGuard)
    async getAllDrivers() {
        return await this.userService.getAllDrivers();
    }

    @Get('/drivers/verified')
    async getVerifiedDrivers() {
        return await this.userService.getVerifiedDrivers();
    }

    @Get('/riders')
    @UseGuards(AdminGuard)
    async getAllRiders() {
        return await this.userService.getAllRiders();
    }

    @Get('/riders/:id/discount')
    async getRiderDiscount(@Param('id') id: string) {
        const discount = await this.userService.getRiderDiscount(id);
        return { riderId: id, discountPercentage: discount };
    }

    @Get('/riders/:id/frequent')
    async isFrequentRider(@Param('id') id: string) {
        const isFrequent = await this.userService.isFrequentRider(id);
        return { riderId: id, isFrequentRider: isFrequent };
    }
}