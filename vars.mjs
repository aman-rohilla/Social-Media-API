import express from 'express'
import {config} from 'dotenv'
config()
import 'express-async-errors'
import mongoose from 'mongoose'

import jwt from 'jsonwebtoken'
import bcrpyt from 'bcryptjs'


const PORT = process.env.PORT || 5000
const IP   = process.env.IP || '0.0.0.0'

const JWT_SECRET     = process.env.JWT_SECRET     || 'wgtjwkoovgwrjzbgtodmgnsdnjdmhdhd'
const CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/social_media'

export {express, mongoose, jwt, bcrpyt, PORT, JWT_SECRET, CONNECTION_STRING, IP}
