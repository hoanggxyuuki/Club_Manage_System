import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sendAnonymousEmail } from "../../services/anonymous";
import {
  initiateGoogleLogin,
  initiateMicrosoftLogin,
} from "../../services/auth";
import { getRegistrationStatus } from "../../services/systemConfig";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { TweenMax, Expo, Quad } from "gsap";

const Login = () => {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [files, setFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const fileInputRef = useRef(null);
  const [anonymousCaptchaToken, setAnonymousCaptchaToken] = useState(null);
  const anonymousCaptchaRef = useRef(null);

  const [userData, setUserData] = useState({
    title: "",
    description: "",
  });

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const svgRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  const [gsapLoaded, setGsapLoaded] = useState(false);

  const armLRef = useRef(null);
  const armRRef = useRef(null);
  const eyeLRef = useRef(null);
  const eyeRRef = useRef(null);
  const noseRef = useRef(null);
  const mouthRef = useRef(null);
  const chinRef = useRef(null);
  const faceRef = useRef(null);
  const eyebrowRef = useRef(null);
  const outerEarLRef = useRef(null);
  const outerEarRRef = useRef(null);
  const earHairLRef = useRef(null);
  const earHairRRef = useRef(null);
  const hairRef = useRef(null);

  
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrationSetting = async () => {
      try {
        setRegistrationLoading(true);
        const statusData = await getRegistrationStatus();
        if (statusData && typeof statusData.registrationEnabled === "boolean") {
          setRegistrationOpen(statusData.registrationEnabled);
        } else {
          console.warn(
            "Registration status data is not in expected format:",
            statusData,
          );
          setRegistrationOpen(false); 
        }
      } catch (error) {
        console.error(
          "Failed to fetch registration status for login page:",
          error,
        );
        setRegistrationOpen(false); 
      } finally {
        setRegistrationLoading(false);
      }
    };
    fetchRegistrationSetting();
  }, []);

  
  useEffect(() => {
    if (!svgRef.current) return;

    
    armLRef.current = svgRef.current.querySelector(".armL");
    armRRef.current = svgRef.current.querySelector(".armR");
    eyeLRef.current = svgRef.current.querySelector(".eyeL");
    eyeRRef.current = svgRef.current.querySelector(".eyeR");
    noseRef.current = svgRef.current.querySelector(".nose");
    mouthRef.current = svgRef.current.querySelector(".mouth");
    chinRef.current = svgRef.current.querySelector(".chin");
    faceRef.current = svgRef.current.querySelector(".face");
    eyebrowRef.current = svgRef.current.querySelector(".eyebrow");
    outerEarLRef.current = svgRef.current.querySelector(".earL .outerEar");
    outerEarRRef.current = svgRef.current.querySelector(".earR .outerEar");
    earHairLRef.current = svgRef.current.querySelector(".earL .earHair");
    earHairRRef.current = svgRef.current.querySelector(".earR .earHair");
    hairRef.current = svgRef.current.querySelector(".hair");

    
    if (armLRef.current && armRRef.current) {
      TweenMax.set(armLRef.current, {
        x: -93,
        y: 220,
        rotation: 105,
        transformOrigin: "top left",
      });
      TweenMax.set(armRRef.current, {
        x: -93,
        y: 220,
        rotation: -105,
        transformOrigin: "top right",
      });
      setGsapLoaded(true);
    }
  }, [svgRef.current]);

  
  const handleEmailFocus = useCallback(() => {
    if (!gsapLoaded) return;

    
    TweenMax.set(armLRef.current, {
      y: 220,
      rotation: 105,
      transformOrigin: "top left",
    });
    TweenMax.set(armRRef.current, {
      y: 220,
      rotation: -105,
      transformOrigin: "top right",
    });

    
    TweenMax.to([eyeLRef.current, eyeRRef.current], 0.5, {
      scaleX: 1.1,
      scaleY: 1.1,
      ease: Expo.easeOut,
    });
  }, [gsapLoaded]);

  
  const handleEmailBlur = useCallback(() => {
    if (!gsapLoaded) return;
    resetFace();
  }, [gsapLoaded]);

  
  const handlePasswordFocus = useCallback(() => {
    if (!gsapLoaded) return;
    coverEyes();
  }, [gsapLoaded]);

  
  const handlePasswordBlur = useCallback(() => {
    if (!gsapLoaded) return;
    uncoverEyes();
  }, [gsapLoaded]);

  
  const coverEyes = useCallback(() => {
    TweenMax.to(armLRef.current, 0.45, {
      x: -93,
      y: 10,
      rotation: 0,
      ease: Quad.easeOut,
    });
    TweenMax.to(armRRef.current, 0.45, {
      x: -93,
      y: 10,
      rotation: 0,
      ease: Quad.easeOut,
      delay: 0.1,
    });
  }, []);

  
  const uncoverEyes = useCallback(() => {
    TweenMax.to(armLRef.current, 1.35, {
      y: 220,
      ease: Quad.easeOut,
    });
    TweenMax.to(armLRef.current, 1.35, {
      rotation: 105,
      ease: Quad.easeOut,
      delay: 0.1,
    });
    TweenMax.to(armRRef.current, 1.35, {
      y: 220,
      ease: Quad.easeOut,
    });
    TweenMax.to(armRRef.current, 1.35, {
      rotation: -105,
      ease: Quad.easeOut,
      delay: 0.1,
    });
  }, []);

  
  const resetFace = useCallback(() => {
    TweenMax.to([eyeLRef.current, eyeRRef.current], 1, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      ease: Expo.easeOut,
    });
    TweenMax.to(noseRef.current, 1, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      ease: Expo.easeOut,
    });
    TweenMax.to(mouthRef.current, 1, {
      x: 0,
      y: 0,
      rotation: 0,
      ease: Expo.easeOut,
    });
    TweenMax.to(chinRef.current, 1, {
      x: 0,
      y: 0,
      scaleY: 1,
      ease: Expo.easeOut,
    });
    TweenMax.to([faceRef.current, eyebrowRef.current], 1, {
      x: 0,
      y: 0,
      skewX: 0,
      ease: Expo.easeOut,
    });
    TweenMax.to(
      [
        outerEarLRef.current,
        outerEarRRef.current,
        earHairLRef.current,
        earHairRRef.current,
        hairRef.current,
      ],

      1,
      {
        x: 0,
        y: 0,
        scaleY: 1,
        ease: Expo.easeOut,
      },
    );
  }, []);

  
  useEffect(() => {
    if (!emailRef.current || !passwordRef.current || !gsapLoaded) return;

    const email = emailRef.current;
    const password = passwordRef.current;

    email.addEventListener("focus", handleEmailFocus);
    email.addEventListener("blur", handleEmailBlur);
    password.addEventListener("focus", handlePasswordFocus);
    password.addEventListener("blur", handlePasswordBlur);

    return () => {
      email.removeEventListener("focus", handleEmailFocus);
      email.removeEventListener("blur", handleEmailBlur);
      password.removeEventListener("focus", handlePasswordFocus);
      password.removeEventListener("blur", handlePasswordBlur);
    };
  }, [
    handleEmailFocus,
    handleEmailBlur,
    handlePasswordFocus,
    handlePasswordBlur,
    gsapLoaded,
  ]);

  
  useEffect(() => {
    if (!gsapLoaded || !svgRef.current) return;

    const handleMouseMove = (e) => {
      const svgRect = svgRef.current.getBoundingClientRect();
      const svgCenterX = svgRect.left + svgRect.width / 2;
      const svgCenterY = svgRect.top + svgRect.height / 2;

      
      const deltaX = (e.clientX - svgCenterX) / 25;
      const deltaY = (e.clientY - svgCenterY) / 25;

      
      const eyeMaxHorizD = 5;
      const eyeMaxVertD = 3;
      const noseMaxHorizD = 3;
      const noseMaxVertD = 2;

      const eyeX = Math.max(-eyeMaxHorizD, Math.min(eyeMaxHorizD, deltaX));
      const eyeY = Math.max(-eyeMaxVertD, Math.min(eyeMaxVertD, deltaY));
      const noseX = eyeX * 0.5;
      const noseY = eyeY * 0.5;

      
      
      TweenMax.to([eyeLRef.current, eyeRRef.current], 0.5, {
        x: eyeX, 
        y: eyeY, 
        ease: Expo.easeOut,
      });

      TweenMax.to(noseRef.current, 0.5, {
        x: noseX, 
        y: noseY, 
        ease: Expo.easeOut,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gsapLoaded]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && user) {
      navigate(user.role === "admin" ? "/admin" : "/member", { replace: true });
    }
  }, [user, navigate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handlePaste = useCallback((e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const imageItems = Array.from(items).filter(
      (item) => item.type.indexOf("image") !== -1,
    );

    imageItems.forEach((item) => {
      const file = item.getAsFile();
      handleFiles([file]);
    });
  }, []);

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
    );

    if (validFiles.length + files.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setError("");
  };

  const handleFileInput = (e) => {
    handleFiles(Array.from(e.target.files));
  };

  const handleImageUrlInput = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const url = e.target.value.trim();
      if (url && imageUrls.length < 5) {
        try {
          new URL(url);
          setImageUrls((prev) => [...prev, url]);
          e.target.value = "";
          setError("");
        } catch (err) {
          setError("Invalid URL format");
        }
      }
    }
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const removeImageUrl = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnonymousVerify = (token) => {
    setAnonymousCaptchaToken(token);
    setError("");
  };

  const handleAnonymousCaptchaError = (err) => {
    setError("Xác thực captcha thất bại. Vui lòng thử lại.");
    console.error("Anonymous captcha error:", err);
    setAnonymousCaptchaToken(null);
  };

  const handleAnonymousSubmit = async (e) => {
    e.preventDefault();

    if (!anonymousCaptchaToken) {
      setError("Vui lòng xác thực captcha");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", userData.title);
      formData.append("description", userData.description);
      formData.append("captchaToken", anonymousCaptchaToken);

      files.forEach((file, index) => {
        formData.append(`media_${index}`, file);
      });

      if (imageUrls.length > 0) {
        formData.append("imageUrls", JSON.stringify(imageUrls));
      }

      await sendAnonymousEmail(formData);
      setShowModal(false);
      setShowToast(true);

      setUserData({ title: "", description: "" });
      setFiles([]);
      setImageUrls([]);
      setError("");

      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setError(error.message || "Error sending mail");
    }
  };

  const handleLogin = async () => {
    try {
      if (!captchaToken) {
        setError("Vui lòng xác thực captcha");
        return;
      }

      const user = await login({
        ...formData,
        captchaToken,
      });
      navigate(
        user.role === "admin"
          ? "/admin"
          : user.role === "demo"
            ? "/demo"
            : "/member",
      );
    } catch (err) {
      setError(err.message);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  const handleVerify = (token) => {
    setCaptchaToken(token);
    setError("");
  };

  const onCaptchaError = (err) => {
    setError("Xác thực captcha thất bại. Vui lòng thử lại.");
    console.error("Captcha error:", err);
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin();
  };

  const handleKeyPress = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleLogin();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setError("");
    setUserData({ title: "", description: "" });
    setFiles([]);
    setImageUrls([]);
    setAnonymousCaptchaToken(null);
    anonymousCaptchaRef.current?.resetCaptcha();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d1e7f3] via-[#e8f4fa] to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Snow Effect */}
      <div className="snowflakes" aria-hidden="true">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="snowflake">
            ❅
          </div>
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={i + 10} className="snowflake">
            ❆
          </div>
        ))}
      </div>

      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Email đã được gửi thành công!
              </p>
              <p className="mt-1 text-xs text-green-700">
                Tin nhắn ẩn danh của bạn đã được gửi.
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 text-green-700 hover:text-green-900 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#a9ddf3] relative">
          {/* SVG Yeti Container */}
          <div className="svgContainer w-48 h-48 mx-auto mb-4 rounded-full bg-[#a9ddf3] border-2 border-[#3A5E77] overflow-hidden relative">
            <div className="relative w-full h-0 pb-[100%] overflow-hidden">
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 200 200"
              >
                <defs>
                  <circle id="armMaskPath" cx="100" cy="100" r="100" />
                </defs>
                <clipPath id="armMask">
                  <use xlinkHref="#armMaskPath" overflow="visible" />
                </clipPath>
                <circle cx="100" cy="100" r="100" fill="#a9ddf3" />

                <g className="body">
                  <path
                    fill="#FFFFFF"
                    d="M193.3,135.9c-5.8-8.4-15.5-13.9-26.5-13.9H151V72c0-27.6-22.4-50-50-50S51,44.4,51,72v50H32.1 c-10.6,0-20,5.1-25.8,13l0,78h187L193.3,135.9z"
                  />

                  <path
                    fill="none"
                    stroke="#3A5E77"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M193.3,135.9 c-5.8-8.4-15.5-13.9-26.5-13.9H151V72c0-27.6-22.4-50-50-50S51,44.4,51,72v50H32.1c-10.6,0-20,5.1-25.8,13"
                  />

                  <path
                    fill="#DDF1FA"
                    d="M100,156.4c-22.9,0-43,11.1-54.1,27.7c15.6,10,34.2,15.9,54.1,15.9s38.5-5.8,54.1-15.9 C143,167.5,122.9,156.4,100,156.4z"
                  />
                </g>
                <g className="earL">
                  <g
                    className="outerEar"
                    fill="#ddf1fa"
                    stroke="#3a5e77"
                    strokeWidth="2.5"
                  >
                    <circle cx="47" cy="83" r="11.5" />
                    <path
                      d="M46.3 78.9c-2.3 0-4.1 1.9-4.1 4.1 0 2.3 1.9 4.1 4.1 4.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g className="earHair">
                    <rect x="51" y="64" fill="#FFFFFF" width="15" height="35" />

                    <path
                      d="M53.4 62.8C48.5 67.4 45 72.2 42.8 77c3.4-.1 6.8-.1 10.1.1-4 3.7-6.8 7.6-8.2 11.6 2.1 0 4.2 0 6.3.2-2.6 4.1-3.8 8.3-3.7 12.5 1.2-.7 3.4-1.4 5.2-1.9"
                      fill="#fff"
                      stroke="#3a5e77"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
                <g className="earR">
                  <g
                    className="outerEar"
                    fill="#ddf1fa"
                    stroke="#3a5e77"
                    strokeWidth="2.5"
                  >
                    <circle cx="155" cy="83" r="11.5" />
                    <path
                      d="M155.7 78.9c2.3 0 4.1 1.9 4.1 4.1 0 2.3-1.9 4.1-4.1 4.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <g className="earHair">
                    <rect
                      x="131"
                      y="64"
                      fill="#FFFFFF"
                      width="20"
                      height="35"
                    />

                    <path
                      d="M148.6 62.8c4.9 4.6 8.4 9.4 10.6 14.2-3.4-.1-6.8-.1-10.1.1 4 3.7 6.8 7.6 8.2 11.6-2.1 0-4.2 0-6.3.2 2.6 4.1 3.8 8.3 3.7 12.5-1.2-.7-3.4-1.4-5.2-1.9"
                      fill="#fff"
                      stroke="#3a5e77"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
                <path
                  className="chin"
                  d="M84.1 121.6c2.7 2.9 6.1 5.4 9.8 7.5l.9-4.5c2.9 2.5 6.3 4.8 10.2 6.5 0-1.9-.1-3.9-.2-5.8 3 1.2 6.2 2 9.7 2.5-.3-2.1-.7-4.1-1.2-6.1"
                  fill="none"
                  stroke="#3a5e77"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  className="face"
                  fill="#DDF1FA"
                  d="M134.5,46v35.5c0,21.815-15.446,39.5-34.5,39.5s-34.5-17.685-34.5-39.5V46"
                />

                <path
                  className="hair"
                  fill="#FFFFFF"
                  stroke="#3A5E77"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M81.457,27.929 c1.755-4.084,5.51-8.262,11.253-11.77c0.979,2.565,1.883,5.14,2.712,7.723c3.162-4.265,8.626-8.27,16.272-11.235 c-0.737,3.293-1.588,6.573-2.554,9.837c4.857-2.116,11.049-3.64,18.428-4.156c-2.403,3.23-5.021,6.391-7.852,9.474"
                />

                <g className="eyebrow">
                  <path
                    fill="#FFFFFF"
                    d="M138.142,55.064c-4.93,1.259-9.874,2.118-14.787,2.599c-0.336,3.341-0.776,6.689-1.322,10.037 c-4.569-1.465-8.909-3.222-12.996-5.226c-0.98,3.075-2.07,6.137-3.267,9.179c-5.514-3.067-10.559-6.545-15.097-10.329 c-1.806,2.889-3.745,5.73-5.816,8.515c-7.916-4.124-15.053-9.114-21.296-14.738l1.107-11.768h73.475V55.064z"
                  />

                  <path
                    fill="#FFFFFF"
                    stroke="#3A5E77"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M63.56,55.102 c6.243,5.624,13.38,10.614,21.296,14.738c2.071-2.785,4.01-5.626,5.816-8.515c4.537,3.785,9.583,7.263,15.097,10.329 c1.197-3.043,2.287-6.104,3.267-9.179c4.087,2.004,8.427,3.761,12.996,5.226c0.545-3.348,0.986-6.696,1.322-10.037 c4.913-0.481,9.857-1.34,14.787-2.599"
                  />
                </g>
                <g className="eyeL">
                  <circle cx="85.5" cy="78.5" r="3.5" fill="#3a5e77" />

                  <circle cx="84" cy="76" r="1" fill="#fff" />
                </g>
                <g className="eyeR">
                  <circle cx="114.5" cy="78.5" r="3.5" fill="#3a5e77" />

                  <circle cx="113" cy="76" r="1" fill="#fff" />
                </g>
                <g className="mouth">
                  <path
                    className="mouthBG"
                    fill="#617E92"
                    d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"
                  />

                  <path
                    className="mouthOutline"
                    fill="none"
                    stroke="#3A5E77"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"
                  />
                </g>
                <path
                  className="nose"
                  d="M97.7 79.9h4.7c1.9 0 3 2.2 1.9 3.7l-2.3 3.3c-.9 1.3-2.9 1.3-3.8 0l-2.3-3.3c-1.3-1.6-.2-3.7 1.8-3.7z"
                  fill="#3a5e77"
                />

                <g className="arms" clipPath="url(#armMask)">
                  <g className="armL">
                    <path
                      fill="#ddf1fa"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit="10"
                      strokeWidth="2.5"
                      d="M121.3 97.4L111 58.7l38.8-10.4 20 36.1z"
                    />

                    <path
                      fill="#ddf1fa"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit="10"
                      strokeWidth="2.5"
                      d="M134.4 52.5l19.3-5.2c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1L146 59.7M160.8 76.5l19.4-5.2c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1l-18.3 4.9M158.3 66.8l23.1-6.2c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1l-23.1 6.2M150.9 58.4l26-7c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1l-21.3 5.7"
                    />

                    <path
                      fill="#a9ddf3"
                      d="M178.8 74.7l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8zM180.1 64l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8zM175.5 54.9l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8zM152.1 49.4l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8z"
                    />

                    <path
                      fill="#fff"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M123.5 96.8c-41.4 14.9-84.1 30.7-108.2 35.5L1.2 80c33.5-9.9 71.9-16.5 111.9-21.8"
                    />

                    <path
                      fill="#fff"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M108.5 59.4c7.7-5.3 14.3-8.4 22.8-13.2-2.4 5.3-4.7 10.3-6.7 15.1 4.3.3 8.4.7 12.3 1.3-4.2 5-8.1 9.6-11.5 13.9 3.1 1.1 6 2.4 8.7 3.8-1.4 2.9-2.7 5.8-3.9 8.5 2.5 3.5 4.6 7.2 6.3 11-4.9-.8-9-.7-16.2-2.7M94.5 102.8c-.6 4-3.8 8.9-9.4 14.7-2.6-1.8-5-3.7-7.2-5.7-2.5 4.1-6.6 8.8-12.2 14-1.9-2.2-3.4-4.5-4.5-6.9-4.4 3.3-9.5 6.9-15.4 10.8-.2-3.4.1-7.1 1.1-10.9M97.5 62.9c-1.7-2.4-5.9-4.1-12.4-5.2-.9 2.2-1.8 4.3-2.5 6.5-3.8-1.8-9.4-3.1-17-3.8.5 2.3 1.2 4.5 1.9 6.8-5-.6-11.2-.9-18.4-1 2 2.9.9 3.5 3.9 6.2"
                    />
                  </g>
                  <g className="armR">
                    <path
                      fill="#ddf1fa"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit="10"
                      strokeWidth="2.5"
                      d="M265.4 97.3l10.4-38.6-38.9-10.5-20 36.1z"
                    />

                    <path
                      fill="#ddf1fa"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit="10"
                      strokeWidth="2.5"
                      d="M252.4 52.4L233 47.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l10.3 2.8M226 76.4l-19.4-5.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l18.3 4.9M228.4 66.7l-23.1-6.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l23.1 6.2M235.8 58.3l-26-7c-2.7-.7-5.4.9-6.1 3.5-.7 2.7-.9 5.4 3.5 6.1l21.3 5.7"
                    />

                    <path
                      fill="#a9ddf3"
                      d="M207.9 74.7l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM206.7 64l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM211.2 54.8l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM234.6 49.4l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8z"
                    />

                    <path
                      fill="#fff"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M263.3 96.7c41.4 14.9 84.1 30.7 108.2 35.5l14-52.3C352 70 313.6 63.5 273.6 58.1"
                    />

                    <path
                      fill="#fff"
                      stroke="#3a5e77"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M278.2 59.3l-18.6-10 2.5 11.9-10.7 6.5 9.9 8.7-13.9 6.4 9.1 5.9-13.2 9.2 23.1-.9M284.5 100.1c-.4 4 1.8 8.9 6.7 14.8 3.5-1.8 6.7-3.6 9.7-5.5 1.8 4.2 5.1 8.9 10.1 14.1 2.7-2.1 5.1-4.4 7.1-6.8 4.1 3.4 9 7 14.7 11 1.2-3.4 1.8-7 1.7-10.9M314 66.7s5.4-5.7 12.6-7.4c1.7 2.9 3.3 5.7 4.9 8.6 3.8-2.5 9.8-4.4 18.2-5.7.1 3.1.1 6.1 0 9.2 5.5-1 12.5-1.6 20.8-1.9-1.4 3.9-2.5 8.4-2.5 8.4"
                    />
                  </g>
                </g>
              </svg>
            </div>
          </div>

          <div className="text-center space-y-2 mb-6">
            <h2 className="text-3xl font-bold text-[#217093] tracking-tight">
              Chào mừng trở lại!
            </h2>
            <p className="text-[#4eb8dd]">╚═════ஓ๑♡๑ஓ═════╝</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="inputGroup">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#217093] mb-2"
              >
                Email
              </label>
              <div className="relative">
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-[65px] px-4 py-4 text-lg bg-[#f3fafd] border-2 border-[#217093] rounded-md text-gray-800 font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4eb8dd] focus:border-[#4eb8dd] transition-all"
                  placeholder="email@domain.com"
                />

                <p className="w-[30px] h-[30px]"></p>
              </div>
            </div>

            <div className="inputGroup">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#217093] mb-2"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-[65px] px-4 py-4 text-lg bg-[#f3fafd] border-2 border-[#217093] rounded-md text-gray-800 font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4eb8dd] focus:border-[#4eb8dd] transition-all"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-[#217093]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-[#217093]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-sm font-medium text-[#217093] hover:text-[#4eb8dd] transition-colors"
              >
                Gửi Email Ẩn Danh
              </button>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#217093] hover:text-[#4eb8dd] transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <div className="flex justify-center my-4">
              <HCaptcha
                sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                onVerify={handleVerify}
                onError={onCaptchaError}
                ref={captchaRef}
              />
            </div>

            <div className="inputGroup">
              <button
                type="submit"
                className={`w-full h-[65px] text-lg text-white font-semibold rounded-md ${
                  captchaToken
                    ? "bg-[#4eb8dd] hover:bg-[#217093]"
                    : "bg-gray-400 cursor-not-allowed"
                } transition-colors`}
                disabled={!captchaToken}
              >
                Đăng nhập
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#a9ddf3]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#4eb8dd]">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={initiateGoogleLogin}
                className="w-full flex items-center justify-center px-4 py-4 border border-[#a9ddf3] rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4eb8dd] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />

                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.09h-3.98c-.8 1.6-1.27 3.41-1.27 5.38s.46 3.78 1.27 5.38l3.98-3.09z"
                  />

                  <path
                    fill="#EA4335"
                    d="M12.255 5.04c1.77 0 3.35.61 4.6 1.8l3.42-3.42c-2.07-1.94-4.78-3.13-8.02-3.13-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Đăng nhập bằng Google
              </button>
            </div>
          </form>

          {/* Registration Link - Conditionally Rendered */}
          {!registrationLoading && registrationOpen && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Register here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Anonymous Mail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl my-8 border-2 border-[#a9ddf3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#217093]">
                Gửi Email Ẩn Danh
              </h3>
              <button
                onClick={closeModal}
                className="text-[#4eb8dd] hover:text-[#217093] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAnonymousSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[#217093] mb-1"
                >
                  Tiêu đề
                </label>
                <input
                  type="text"
                  id="title"
                  placeholder="Nhập tiêu đề"
                  className="w-full p-3 bg-[#f3fafd] border-2 border-[#217093] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4eb8dd] focus:border-[#4eb8dd] transition-all"
                  value={userData.title}
                  onChange={(e) =>
                    setUserData({ ...userData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#217093] mb-1"
                >
                  Nội dung
                </label>
                <textarea
                  id="description"
                  placeholder="Nhập nội dung"
                  className="w-full p-3 bg-[#f3fafd] border-2 border-[#217093] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4eb8dd] focus:border-[#4eb8dd] transition-all"
                  value={userData.description}
                  onChange={(e) =>
                    setUserData({ ...userData, description: e.target.value })
                  }
                  onPaste={handlePaste}
                  rows="4"
                  required
                />
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="mb-4 p-4 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-[#4eb8dd] border-[#a9ddf3] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-[#217093]">
                  Kéo thả file ảnh hoặc click để chọn
                </p>
                <p className="text-xs text-[#4eb8dd] mt-1">
                  Tối đa 5 ảnh, mỗi ảnh không quá 10MB
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Preview Section */}
              {(files.length > 0 || imageUrls.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#217093]">
                    Xem trước:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {files.map((file, index) => (
                      <div key={`file-${index}`} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {imageUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative group">
                        <img
                          src={url}
                          alt={`URL Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />

                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="space-y-4">
                <div className="flex justify-center">
                  <HCaptcha
                    sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                    onVerify={handleAnonymousVerify}
                    onError={handleAnonymousCaptchaError}
                    ref={anonymousCaptchaRef}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-[#217093] hover:text-[#4eb8dd] transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!anonymousCaptchaToken}
                    className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${
                      anonymousCaptchaToken
                        ? "bg-[#4eb8dd] hover:bg-[#217093]"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Gửi Email
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .snowflakes {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }

        .snowflake {
          color: #fff;
          font-size: 1.5em;
          font-family: Arial, sans-serif;
          text-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
          position: absolute;
          top: -10%;
          animation: snowfall linear infinite;
        }

        @keyframes snowfall {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        .snowflake:nth-of-type(1) {
          left: 10%;
          animation-duration: 12s;
          animation-delay: 0s;
        }
        .snowflake:nth-of-type(2) {
          left: 20%;
          animation-duration: 14s;
          animation-delay: 1s;
        }
        .snowflake:nth-of-type(3) {
          left: 30%;
          animation-duration: 16s;
          animation-delay: 2s;
        }
        .snowflake:nth-of-type(4) {
          left: 40%;
          animation-duration: 12s;
          animation-delay: 0.5s;
        }
        .snowflake:nth-of-type(5) {
          left: 50%;
          animation-duration: 15s;
          animation-delay: 1.5s;
        }
        .snowflake:nth-of-type(6) {
          left: 60%;
          animation-duration: 13s;
          animation-delay: 2.5s;
        }
        .snowflake:nth-of-type(7) {
          left: 70%;
          animation-duration: 17s;
          animation-delay: 0.2s;
        }
        .snowflake:nth-of-type(8) {
          left: 80%;
          animation-duration: 12.5s;
          animation-delay: 1.2s;
        }
        .snowflake:nth-of-type(9) {
          left: 90%;
          animation-duration: 14.7s;
          animation-delay: 2.7s;
        }
        .snowflake:nth-of-type(10) {
          left: 95%;
          animation-duration: 13.2s;
          animation-delay: 1.7s;
        }
        .snowflake:nth-of-type(11) {
          left: 15%;
          animation-duration: 15.5s;
          animation-delay: 0.7s;
        }
        .snowflake:nth-of-type(12) {
          left: 25%;
          animation-duration: 13.8s;
          animation-delay: 1.3s;
        }
        .snowflake:nth-of-type(13) {
          left: 35%;
          animation-duration: 16.3s;
          animation-delay: 2.3s;
        }
        .snowflake:nth-of-type(14) {
          left: 45%;
          animation-duration: 12.8s;
          animation-delay: 0.8s;
        }
        .snowflake:nth-of-type(15) {
          left: 55%;
          animation-duration: 15.3s;
          animation-delay: 1.8s;
        }
        .snowflake:nth-of-type(16) {
          left: 65%;
          animation-duration: 13.3s;
          animation-delay: 2.2s;
        }
        .snowflake:nth-of-type(17) {
          left: 75%;
          animation-duration: 17.8s;
          animation-delay: 0.3s;
        }
        .snowflake:nth-of-type(18) {
          left: 85%;
          animation-duration: 12.9s;
          animation-delay: 1.6s;
        }
        .snowflake:nth-of-type(19) {
          left: 92%;
          animation-duration: 14.1s;
          animation-delay: 2.6s;
        }
        .snowflake:nth-of-type(20) {
          left: 5%;
          animation-duration: 13.9s;
          animation-delay: 1.9s;
        }
      `}</style>
    </div>
  );
};

export default Login;
