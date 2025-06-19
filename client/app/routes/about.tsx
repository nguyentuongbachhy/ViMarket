import { ArrowRight, Award, Brain, Code, Smartphone, Users } from "lucide-react";
import type { Route } from "./+types/about";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Về chúng tôi | AI & Full-Stack Development" },
        { name: "description", content: "Expert AI, full-stack, and mobile development services. Transforming ideas into innovative digital solutions." },
    ];
}

export default function About() {
    const skills = [
        {
            icon: Brain,
            title: "AI & Machine Learning",
            description: "Advanced AI solutions, neural networks, and intelligent automation systems"
        },
        {
            icon: Code,
            title: "Full-Stack Development",
            description: "End-to-end web applications using modern frameworks and technologies"
        },
        {
            icon: Smartphone,
            title: "Mobile Development",
            description: "Native and cross-platform mobile apps for iOS and Android"
        }
    ];

    const stats = [
        { number: "100+", label: "Projects Completed" },
        { number: "5+", label: "Years Experience" },
        { number: "50+", label: "Happy Clients" },
        { number: "24/7", label: "Support Available" }
    ];

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <section className="relative px-6 py-20 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 mb-6">
                            <Brain className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Building the
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                Future with AI
                            </span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                            We specialize in creating intelligent, scalable, and innovative digital solutions
                            that transform businesses and enhance user experiences through cutting-edge technology.
                        </p>
                    </div>
                </div>
            </section>

            {/* Skills Section */}
            <section className="px-6 py-16 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Our Expertise</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Combining artificial intelligence with full-stack development to create exceptional digital experiences
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {skills.map((skill, index) => (
                            <div key={index} className="group">
                                <div className="relative p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative">
                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl mb-6">
                                            <skill.icon className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-3">{skill.title}</h3>
                                        <p className="text-gray-400 leading-relaxed">{skill.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="px-6 py-16 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                                <div className="text-gray-400 text-sm uppercase tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="px-6 py-16 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-slate-700/50">
                        <div className="text-center">
                            <Award className="w-12 h-12 text-blue-400 mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                            <p className="text-lg text-gray-300 leading-relaxed mb-8">
                                To bridge the gap between cutting-edge artificial intelligence and practical business solutions.
                                We believe in creating technology that not only solves problems but also enhances human potential
                                and drives innovation across industries.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <div className="flex items-center text-blue-400">
                                    <Users className="w-5 h-5 mr-2" />
                                    <span>Client-Focused Approach</span>
                                </div>
                                <div className="flex items-center text-blue-400">
                                    <ArrowRight className="w-5 h-5 mr-2" />
                                    <span>Innovation-Driven Solutions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}