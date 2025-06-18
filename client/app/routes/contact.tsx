import { Clock, Facebook, Globe, Linkedin, Mail, MapPin, Phone, Send } from "lucide-react";
import type { Route } from "./+types/contact";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Liên Hệ Chúng Tôi | Kết Nối Ngay" },
        { name: "description", content: "Sẵn sàng bắt đầu dự án AI hoặc phát triển tiếp theo của bạn? Liên hệ với đội ngũ chuyên gia của chúng tôi ngay hôm nay." },
    ];
}

export default function Contact() {
    const contactInfo = [
        {
            icon: Mail,
            title: "Email",
            details: "noreply@vimarket.com",
            description: "Send us an email anytime!"
        },
        {
            icon: Phone,
            title: "Phone",
            details: "+84 911076983",
            description: "Mon-Fri from 8.AM to 6.PM"
        },
        {
            icon: MapPin,
            title: "Office",
            details: "HCMUS",
            description: "Come say hello at our office"
        },
        {
            icon: Clock,
            title: "Working Hours",
            details: "Mon-Fri: 8.AM-6.PM",
            description: "Weekend support available"
        }
    ];

    const socialLinks = [
        { icon: Linkedin, name: "LinkedIn", href: "https://www.linkedin.com/in/bach-hy-nguyen-tuong-bb1521340/" },
        { icon: Globe, name: "Website", href: "http://localhost:5173" },
        { icon: Facebook, name: "Facebook", href: "https://www.facebook.com/NguyenTuongBachHy" }
    ];

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <section className="px-6 py-20 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 mb-6">
                            <Send className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Let's Build Something
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                Amazing Together
                            </span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                            Ready to transform your ideas into reality? Our team of AI and full-stack experts
                            is here to help you build the future.
                        </p>
                    </div>
                </div>
            </section>

            <div className="px-6 pb-20 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
                            <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Your first name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Your last name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="project" className="block text-sm font-medium text-gray-300 mb-2">
                                        Project Type
                                    </label>
                                    <select
                                        id="project"
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="">Select a project type</option>
                                        <option value="ai">AI & Machine Learning</option>
                                        <option value="web">Web Development</option>
                                        <option value="mobile">Mobile App</option>
                                        <option value="consulting">Consulting</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={5}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                        placeholder="Tell us about your project..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group"
                                >
                                    <span>Send Message</span>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                </button>
                            </form>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">Get in touch</h2>
                                <p className="text-gray-300 leading-relaxed mb-8">
                                    We're here to help bring your vision to life. Whether you need AI integration,
                                    full-stack development, or mobile app creation, our team is ready to deliver
                                    exceptional results.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {contactInfo.map((item, index) => (
                                    <div key={index} className="group">
                                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                                                        <item.icon className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                                                    <p className="text-blue-400 font-medium mb-1">{item.details}</p>
                                                    <p className="text-sm text-gray-400">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social Links */}
                            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                                <h3 className="font-semibold text-white mb-4">Follow us</h3>
                                <div className="flex space-x-4">
                                    {socialLinks.map((social, index) => (
                                        <a
                                            key={index}
                                            href={social.href}
                                            className="w-10 h-10 bg-slate-700/50 hover:bg-blue-500/20 rounded-xl flex items-center justify-center transition-all duration-200 group"
                                        >
                                            <social.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Response Promise */}
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    <h3 className="font-semibold text-white">Quick Response</h3>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    We typically respond to all inquiries within 24 hours during business days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}