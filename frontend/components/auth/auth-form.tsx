"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

type AuthMode = "login" | "doctor-login" | "signup"

interface AuthFormProps {
  mode: AuthMode
  onSuccess?: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess }) => {
  const isSignup = mode === "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignup && password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }
    setIsLoading(true)
    try {
      const endpoint = isSignup ? "signup" : "login"
      const body: any = isSignup ? { name, email, password, phone_number: phoneNumber } : { email, password }
      const response = await fetch(`${API_BASE_URL}/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) {
        alert(`${isSignup ? "Signup" : "Login"} failed: ${JSON.stringify(data)}`)
        return
      }
      if (mode === "doctor-login" && data?.user?.role !== "doctor") {
        alert("This account is not a doctor account.")
        return
      }
      // Persist tokens & user
      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)
      localStorage.setItem("user", JSON.stringify(data.user))
      const hash = btoa(email).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32)
      const redirectPath = mode === "doctor-login" || data.user.role === "doctor" ? `/doctor-dashboard/${hash}` : `/dashboard/${hash}`
      if (onSuccess) onSuccess()
      window.location.href = redirectPath
    } catch (err) {
      console.error(err)
      alert("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              required
            />
          </div>
        )}
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-foreground">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
        {!isSignup && (
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary/20" />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-primary hover:text-primary/80">Forgot password?</a>
          </div>
        )}
        {isSignup && (
          <div className="flex items-start space-x-2">
            <input type="checkbox" id="terms" className="mt-1 rounded border-border bg-background text-primary focus:ring-primary/20" required />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree to the <a href="/terms" className="text-primary hover:text-primary/80">Terms of Service</a> and <a href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</a>
            </label>
          </div>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-colors"
        >
          {isLoading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>
      <div className="mt-6 text-center">
        {isSignup ? (
          <p className="text-muted-foreground">
            Already have an account? <a href="/login" className="text-primary hover:text-primary/80 font-medium">Sign in</a>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Don't have an account? <a href="/signup" className="text-primary hover:text-primary/80 font-medium">Sign up</a>
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default AuthForm
