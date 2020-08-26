import mongoose from 'mongoose'
import BankRequestType  from './BankRequestType';

interface BankRequest extends mongoose.Document {
    request: string
    value: number
    type: BankRequestType
    bankId: string
    comment: string
    date: string
    client?: string
    destination?: string
    status: string
}

export default BankRequest