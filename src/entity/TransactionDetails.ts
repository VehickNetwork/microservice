import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class TransactionDetails {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  txHash: string

  @Column()
  carAddress: string

  @Column()
  action: string

  @Column()
  actionValue: string

  @Column()
  timestamp: number

  @Column()
  scResult: string
}
