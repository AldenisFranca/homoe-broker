import { Controller, Get, Param } from '@nestjs/common';
// import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
// import { InitTransactionDto } from './order.dto';
import { OrdersService } from './orders.service';

type ExecuteTransactionMessage = {
  order_id: string;
  investor_id: string;
  asset_id: string;
  order_type: string;
  status: 'OPEN' | 'CLOSED';
  partial: number;
  shares: number;
  transactions: {
    transaction_id: string;
    buyer_id: string;
    seller_id: string;
    asset_id: string;
    shares: number;
    price: number;
  }[];
};

@Controller('wallets/:wallet_id/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  all(@Param('wallet_id') wallet_id: string) {
    return this.ordersService.all({ wallet_id });
  }

  // @Post()
  // initTransaction(
  //   @Param('wallet_id') wallet_id: string,
  //   @Body() body: Omit<InitTransactionDto, 'wallet_id'>,
  // ) {
  //   return this.ordersService.initTransaction({
  //     ...body,
  //     wallet_id,
  //   });
  // }

  @MessagePattern('output')
  async executeTransactionConsumer(
    @Payload() message: ExecuteTransactionMessage,
  ) {
    const transaction = message.transactions[message.transactions.length - 1];
    await this.ordersService.executeTransaction({
      order_id: message.order_id,
      status: message.status,
      related_investor_id:
        message.order_type === 'BUY'
          ? transaction.seller_id
          : transaction.buyer_id,
      broker_transaction_id: transaction.transaction_id,
      negotiated_shares: transaction.shares,
      price: transaction.price,
    });
  }
}
