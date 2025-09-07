"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { register } from "@/services/authService";
import { useAuthStore } from "@/stores/useAuthStore";
import { Eye, EyeOff, Loader2, Upload, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatPassword: string;
  phoneNumber: string;
  role: string;
  idNumber: string;
  image: File | null;
  idImageFront: File | null;
  idImageBack: File | null;
}

const RegisterPage = () => {
  const [user, setUser] = useState<UserForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatPassword: "",
    phoneNumber: "",
    role: "",
    idNumber: "",
    image: null,
    idImageFront: null,
    idImageBack: null,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { user: newUser } = useAuthStore();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { success, message } = await register(user);

      if (success) {
        toast.success(message);
        setUser({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          repeatPassword: "",
          phoneNumber: "",
          role: "",
          idNumber: "",
          image: null,
          idImageFront: null,
          idImageBack: null,
        });
        setLoading(false);
        router.push("/login");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to register");
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof UserForm
  ) => {
    setUser({ ...user, [key]: e.target.value });
  };

  const handleSelectChange = (value: string, key: keyof UserForm) => {
    setUser({ ...user, [key]: value });
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof UserForm
  ) => {
    if (e.target.files?.[0]) {
      setUser({ ...user, [key]: e.target.files[0] });
    }
  };

  const removeFile = (key: keyof UserForm) => {
    setUser({ ...user, [key]: null });
  };

  const FileUpload = ({
    label,
    file,
    onChange,
    onRemove,
    required = false,
  }: {
    label: string;
    file: File | null;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    required?: boolean;
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <Upload className="mx-auto h-8 w-8  mb-2" />
          <Input
            type="file"
            onChange={onChange}
            required={required}
            className="hidden"
            id={`file-${label.replace(/\s+/g, "-").toLowerCase()}`}
            accept="image/*"
          />
          <label
            htmlFor={`file-${label.replace(/\s+/g, "-").toLowerCase()}`}
            className="cursor-pointer text-sm"
          >
            Click to upload
          </label>
        </div>
      ) : (
        <div className="relative">
          <div className="border rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 hover:bg-red-100"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <div className="relative h-32 w-full">
              <Image
                src={URL.createObjectURL(file) || "/placeholder.svg"}
                alt={file.name}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <h1 className="text-3xl font-bold ">Owner Registration</h1>
            <p className=" mt-2">
              Please fill in all required information to complete your
              registration
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold  border-b pb-2">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Isaac"
                      value={user.firstName}
                      onChange={(e) => handleInputChange(e, "firstName")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Mayodi"
                      value={user.lastName}
                      onChange={(e) => handleInputChange(e, "lastName")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={user.email}
                      onChange={(e) => handleInputChange(e, "email")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={user.phoneNumber}
                      onChange={(e) => handleInputChange(e, "phoneNumber")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Account Security Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold  border-b pb-2">
                  Account Security
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={user.password}
                      onChange={(e) => handleInputChange(e, "password")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3/5 transform -translate-y-1/2 hover"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="repeatPassword">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={user.repeatPassword}
                      onChange={(e) => handleInputChange(e, "repeatPassword")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3/5 transform -translate-y-1/2 hover"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold  border-b pb-2">
                  Professional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange(value, "role")
                      }
                      required
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500 w-full">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Business Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">
                      National ID Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="idNumber"
                      type="text"
                      placeholder="National ID Number"
                      value={user.idNumber}
                      onChange={(e) => handleInputChange(e, "idNumber")}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold  border-b pb-2">
                  Document Upload (Optional)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FileUpload
                    label="Profile Image"
                    file={user.image}
                    onChange={(e) => handleFileChange(e, "image")}
                    onRemove={() => removeFile("image")}
                  />
                  <FileUpload
                    label="ID Front"
                    file={user.idImageFront}
                    onChange={(e) => handleFileChange(e, "idImageFront")}
                    onRemove={() => removeFile("idImageFront")}
                  />
                  <FileUpload
                    label="ID Back"
                    file={user.idImageBack}
                    onChange={(e) => handleFileChange(e, "idImageBack")}
                    onRemove={() => removeFile("idImageBack")}
                  />
                </div>
              </div>

              <div className="pt-6 border-t w-full flex items-center justify-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Registering...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="w-full">
            <div className="text-center pt-4 border-t border-gray-200 w-full">
              <p className="text-sm">
                Have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Login here
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
