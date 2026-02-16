import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/infrastructure/user.entity';
import { RideRepository } from './ride.repository';


interface AuthenticatedSocket extends Socket {
  user?: User;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RideGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RideGateway.name);
  private driverSockets = new Map<string, string>(); 
  private riderSockets = new Map<string, string>(); 

  private lastLocationUpdate = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly rideRepository: RideRepository,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`New connection attempt from client ${client.id}`);
      
      let token = client.handshake.auth?.token;
      
      if (!token && client.handshake.headers?.authorization) {
        const authHeader = client.handshake.headers.authorization;
        this.logger.log(`Authorization header: ${authHeader?.substring(0, 20)}...`);
        
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else if (typeof authHeader === 'string') {
          token = authHeader;
        }
      }
      
      if (!token && client.handshake.query?.token) {
        token = client.handshake.query.token as string;
        this.logger.log(`Token found in query params`);
      }
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        this.logger.warn(`Auth object: ${JSON.stringify(client.handshake.auth)}`);
        this.logger.warn(`Query: ${JSON.stringify(client.handshake.query)}`);
        this.logger.warn(`Headers: ${JSON.stringify(client.handshake.headers)}`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      token = token.trim();
      
      this.logger.log(`Token length: ${token.length}`);
      this.logger.log(`Token preview: ${token.substring(0, 30)}...${token.substring(token.length - 30)}`);
      this.logger.log(`Verifying token for client ${client.id}`);
      
      const payload = this.jwtService.verify(token);
      this.logger.log(`Token verified, email: ${payload.email}`);
      
      const user = await this.userRepository.findOne({ where: { email: payload.email } });

      if (!user) {
        this.logger.warn(`User not found for email: ${payload.email}`);
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      client.user = user;

      if (user.role === UserRole.DRIVER) {
        this.driverSockets.set(user.id, client.id);
        client.join('drivers');
        this.logger.log(`Driver ${user.email} (${user.id}) connected with socket ${client.id}`);
      } else if (user.role === UserRole.RIDER) {
        this.riderSockets.set(user.id, client.id);
        client.join('riders');
        this.logger.log(`Rider ${user.email} (${user.id}) connected with socket ${client.id}`);
      }

      client.emit('connected', { message: 'Successfully connected to WebSocket', role: user.role });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      client.emit('error', { message: 'Authentication failed', error: error.message });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      const userId = client.user.id;
      this.lastLocationUpdate.delete(client.user.id);
      if (this.driverSockets.get(userId) === client.id) {
        this.driverSockets.delete(userId);
        this.logger.log(`Driver ${client.user.email} disconnected`);
      } else if (this.riderSockets.get(userId) === client.id) {
        this.riderSockets.delete(userId);
        this.logger.log(`Rider ${client.user.email} disconnected`);
      }
    }
  }

  notifyDriversAboutNewRide(rideData: any) {
    this.logger.log(`Notifying all drivers about new ride: ${rideData.rideId}`);
    this.logger.log(`Connected drivers count: ${this.driverSockets.size}`);
    this.logger.log(`Connected riders count: ${this.riderSockets.size}`);
    
    // this.server.emit('ride.requested', rideData);
    // this.logger.log('Broadcasted to ALL connected clients');
    
    this.server.to('drivers').emit('ride.requested', rideData);
    this.logger.log('Sent to drivers room');
  }

  notifyRiderAboutAcceptedRide(riderId: string, rideData: any) {
    const socketId = this.riderSockets.get(riderId);
    
    if (socketId) {
      this.logger.log(`Notifying rider ${riderId} about accepted ride`);
      this.server.to(socketId).emit('ride.accepted', rideData);
    } else {
      this.logger.warn(`Rider ${riderId} is not connected via WebSocket`);
    }
  }

  notifyRiderAboutDriverLocation(riderId: string, locationData: any) {
    const socketId = this.riderSockets.get(riderId);
    
    if (socketId) {
      this.server.to(socketId).emit('driver.location.update', locationData);
    }
  }

    @SubscribeMessage('driver.location.update')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { rideId: string; lat: number; lng: number },
  ) {
    if (client.user?.role !== UserRole.DRIVER) return;

    const now = Date.now();
    const last = this.lastLocationUpdate.get(client.user.id) ?? 0;

    if (now - last < 2000) return;
    this.lastLocationUpdate.set(client.user.id, now);

    const ride = await this.rideRepository.findById(data.rideId);
    if (!ride) return;
    if (ride.driverId !== client.user.id) return;

    this.notifyRiderAboutDriverLocation(ride.riderId, {
      rideId: data.rideId,
      driverId: client.user.id,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date(),
    });
  }
}
