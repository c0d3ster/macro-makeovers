'use client'

import { ToastContainer as ReactToastifyContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const ToastContainer = () => {
  return (
    <ReactToastifyContainer
      position='top-right'
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme='dark'
      closeButton={false}
      icon={false}
      className='mt-20'
    />
  )
}
