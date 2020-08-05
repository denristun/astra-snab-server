import mongoose from 'mongoose'
import BankRequest  from './BankRequest';

interface BankDocument extends mongoose.Document {
    date: string
    income: number
    outcome: number
    destination: string
    client: string
    organization: string
    requests: BankRequest[]
    id:string
    
}

export default BankDocument