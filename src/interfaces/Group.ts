import mongoose from 'mongoose'

interface Group extends mongoose.Document {
    group: string
}

export default Group