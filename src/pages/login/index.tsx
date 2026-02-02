/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Form, Input } from 'antd';
import { LiaHardHatSolid } from 'react-icons/lia';
import { Request } from '../../utils/Request';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Loading from '../../assets/Insider-loading.json'
import toast, { Toaster } from 'react-hot-toast';
import Lottie from 'lottie-react';
import './index.css';

const Login = () => {

  const {user, getUser} = useContext(AuthContext) as any;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
   
    if(user){
      navigate('/')
    }
  }, [])

  const navigate = useNavigate()
  const handleLogin = async(e: any) => {
    setLoading(true);
    try {
      const res = await Request.post("/v1/api/auth/login", e);
      localStorage.setItem("token", res.data.token)
      toast.success("Logged In")
      await getUser(); // Fetch user data and permissions after login
      navigate('/');
      setLoading(false);
    } catch (error) {
      console.log(error);
      if((error as any).response?.data?.message){
        toast.error((error as any).response?.data?.message);
      } else {
        toast.error('Failed to login');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-black via-gray-900 to-black text-white relative overflow-hidden font-sans">
      {/* Shiny light effect */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          className: 'login-toast',
          style: {
            borderRadius: '16px',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(8, 145, 178, 0.9))',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            color: '#f8fafc',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 40px rgba(45, 212, 191, 0.28)',
            animation:
              'loginToastPop 420ms cubic-bezier(0.23, 1, 0.32, 1) forwards, loginToastPulse 3s ease-in-out 420ms infinite alternate',
            willChange: 'transform, opacity, box-shadow',
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#f97316',
              secondary: '#0f172a',
            },
          },
        }}
      />
      <div className="w-1/3 flex flex-col">
        <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-transparent to-white/10" />

        <div className="relative bg-linear-to-br from-white to-gray-100 text-black rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 backdrop-blur-md">
          {/* App Title */}

          <h2 className="text-2xl m-0 font-extrabold tracking-wide uppercase bg-linear-to-r from-black to-gray-700 bg-clip-text text-transparent">
            <LiaHardHatSolid color="#000" />
            KGN
          </h2>
          <h1 className="text-xl font-semibold text-gray-400">Welcome Back</h1>
          <p className="text-center font-medium text-gray-400">
            Login to your account
          </p>

          <Form onFinish={handleLogin} className="space-y-4">
            <Form.Item
              name="login"
              rules={[
                {
                  type: 'email',
                  message: 'The input is not valid E-mail!',
                },
                {
                  required: true,
                  message: 'Please input your E-mail!',
                },
              ]}
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <Input
                  size="large"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/80"
                  placeholder="Enter your email"
                />
              </div>
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please enter your password!',
                },
              ]}
            >
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Password
                </label>
                <Input.Password
                  size="large"
                  className="w-full px-4 py-2 border-gray-300 rounded-lg border! hover:border-black/80"
                  placeholder="••••••••"
                />
              </div>
            </Form.Item>
            <Form.Item>
              <button
                type="submit"
                className="w-full flex items-center justify-center bg-linear-to-b from-black to-teal-600  text-white py-2 rounded-lg font-semibold hover:from-gray-800 hover:to-black transition duration-300 shadow-md hover:shadow-lg"
              >
                  {loading ? <Lottie animationData={Loading} loop={true} className="w-14" /> : 'Login'}
              </button>
            </Form.Item>
          </Form>

          <div className="text-center text-sm text-gray-500">
            <p>
              Don't have an account?{' '}
              <a href="#" className="text-black underline hover:text-gray-700">
              Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Login };
