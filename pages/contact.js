import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageCircle, Calendar, Star, Users, Music, Award } from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import { LocalBusinessSchema, BreadcrumbListSchema } from '../components/StandardSchema';

export default function Contact() {
  const [activeTab, setActiveTab] = useState('contact');

  const contactMethods = [
    {
      icon: Phone,
      title: "Call or Text",
      description: "Fastest way to reach us",
      value: "(901) 410-2020",
      link: "tel:+19014102020",
      color: "bg-green-500"
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Detailed inquiries welcome",
      value: "info@m10djcompany.com",
      link: "mailto:info@m10djcompany.com",
      color: "bg-blue-500"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Instant response during business hours",
      value: "Available 9AM-9PM",
      link: "#contact-form",
      color: "bg-purple-500"
    },
    {
      icon: Calendar,
      title: "Book Consultation",
      description: "Free 30-minute planning session",
      value: "Schedule Online",
      link: "/schedule",
      color: "bg-brand"
    }
  ];

  const serviceAreas = [
    { name: "Memphis", description: "Downtown, Midtown, East Memphis" },
    { name: "Germantown", description: "Professional corporate events" },
    { name: "Collierville", description: "Elegant wedding venues" },
    { name: "Bartlett", description: "Community celebrations" },
    { name: "Arlington", description: "Rural wedding settings" },
    { name: "Cordova", description: "Suburban events" },
    { name: "Southaven", description: "Mississippi border events" },
    { name: "Olive Branch", description: "Cross-state celebrations" }
  ];

  const businessHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 9:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 8:00 PM" },
    { day: "Sunday", hours: "10:00 AM - 6:00 PM" },
    { day: "Emergency Events", hours: "24/7 Available" }
  ];

  return (
    <>
      <Head>
        <title>Contact M10 DJ Company | Memphis DJ Services</title>
        <meta name="description" content="Contact M10 DJ Company for Memphis wedding DJ services, corporate events & private parties. Call (901) 410-2020 or email info@m10djcompany.com. Free consultations!" />
        <meta name="keywords" content="contact Memphis DJ, wedding DJ contact, event DJ Memphis, DJ booking Memphis, Memphis DJ company contact" />
        <link rel="canonical" href="https://m10djcompany.com/contact" />
      </Head>

      {/* Schema Markup */}
      <LocalBusinessSchema 
        businessType="EntertainmentBusiness"
        name="M10 DJ Company"
        description="Memphis's premier wedding and event DJ company"
        telephone="+19014102020"
        email="info@m10djcompany.com"
        address={{
          streetAddress: "65 Stewart Rd",
          addressLocality: "Eads",
          addressRegion: "TN",
          postalCode: "38028",
          addressCountry: "US"
        }}
        geo={{
          latitude: "35.1234",
          longitude: "-89.5678"
        }}
        openingHours="Mo-Fr 09:00-21:00,Sa 10:00-20:00,Su 10:00-18:00"
        priceRange="$395-$1899"
        areaServed={["Memphis", "Germantown", "Collierville", "Bartlett", "Arlington", "Cordova", "Southaven", "Olive Branch"]}
      />
      <BreadcrumbListSchema 
        items={[
          { name: "Home", url: "https://m10djcompany.com/" },
          { name: "Contact", url: "https://m10djcompany.com/contact" }
        ]}
      />

      <Header />

      <main id="main-content" className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-50 to-white py-20">
          <div className="section-container">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Contact <span className="text-brand">M10 DJ Company</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Ready to create an unforgettable event? We're here to help you plan the perfect celebration. 
                Get in touch for a free consultation and custom quote.
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">500+</h3>
                  <p className="text-gray-600">Successful Events</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">15+</h3>
                  <p className="text-gray-600">Years Experience</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-center mb-4">
                    <Music className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">27+</h3>
                  <p className="text-gray-600">Premier Venues</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose your preferred way to reach us. We respond to all inquiries within 24 hours, 
                often much sooner during business hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center mb-4`}>
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{method.description}</p>
                  <a 
                    href={method.link}
                    className="text-brand font-semibold hover:text-brand-600 transition-colors"
                  >
                    {method.value}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                <ContactForm />
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                {/* Business Hours */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Clock className="w-6 h-6 text-brand mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Business Hours</h3>
                  </div>
                  <div className="space-y-3">
                    {businessHours.map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium text-gray-700">{schedule.day}</span>
                        <span className="text-gray-600">{schedule.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Areas */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <MapPin className="w-6 h-6 text-brand mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Service Areas</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serviceAreas.map((area, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-brand rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{area.name}</p>
                          <p className="text-sm text-gray-600">{area.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Choose Us */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Award className="w-6 h-6 text-brand mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Why Choose M10 DJ Company</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                      <span className="text-gray-700">Professional-grade sound systems</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                      <span className="text-gray-700">Experienced MC services</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                      <span className="text-gray-700">Elegant uplighting included</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                      <span className="text-gray-700">Transparent pricing, no hidden fees</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                      <span className="text-gray-700">Free consultation and planning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Common questions about our services and booking process
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How far in advance should I book?</h3>
                <p className="text-gray-700">
                  We recommend booking 6-12 months in advance for weddings and popular dates. However, we can often accommodate shorter timelines based on availability.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What&apos;s included in your packages?</h3>
                <p className="text-gray-700">
                  All packages include professional-grade sound systems, wireless microphones, basic uplighting, and experienced MC services. We also provide free consultation and planning assistance.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Do you travel outside Memphis?</h3>
                <p className="text-gray-700">
                  Yes! We serve a 50-mile radius including Germantown, Collierville, Bartlett, Arlington, Cordova, Southaven, and Olive Branch. Travel fees may apply for distances over 25 miles.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What if I need to cancel or reschedule?</h3>
                <p className="text-gray-700">
                  We understand that plans can change. We offer flexible rescheduling options and will work with you to find a new date. Cancellation policies vary by package and are discussed during booking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-brand text-white">
          <div className="section-container text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Planning Your Event?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let's discuss your vision and create an unforgettable celebration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+19014102020"
                className="bg-white text-brand font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Call (901) 410-2020
              </a>
              <a 
                href="#contact-form"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-brand transition-colors"
              >
                Send Message
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
} 