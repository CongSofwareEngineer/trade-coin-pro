import { Rubik } from 'next/font/google'
import localFont from 'next/font/local'

export const rubik = Rubik({
  variable: '--font-rubik',
  subsets: ['latin'],
  preload: false,
  display: 'swap', // thêm dòng này
})

export const dinBlack = localFont({
  src: '../public/assets/fonts/DIN-Black.otf',
  variable: '--font-din-black',
  preload: false,
  display: 'swap', // thêm dòng này
})
