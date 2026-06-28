'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  Phone, Mail, MessageCircle, HelpCircle, AlertCircle,
  ChevronDown, ChevronUp, Clock, Calendar, CreditCard, XCircle, Users, Lock
} from 'lucide-react';
import { useState } from 'react';

const faqs = {
  booking: [
    {
      question: 'How far in advance can I make a booking?',
      answer: 'You can purchase the bus ticket up to 28 days in advance, depending on the bus operators.',
    },
    {
      question: 'Can I change the departure date and time of my confirmed ticket?',
      answer: 'Please contact our Customer Support Team at least 48 hours prior to your original departure date and time. Changes are subject to availability and depend on the terms and conditions of bus operators.',
    },
    {
      question: 'Can you resend the bus ticket that I bought?',
      answer: 'You can download the ticket again by clicking the download link that we sent via SMS and Email. Otherwise, go to our website and click "Find/Print Your Ticket" to look up your booking.',
    },
    {
      question: 'How long will the selected seat be blocked?',
      answer: 'When you select a seat, it will be locked for 10 minutes during your booking process.',
    },
    {
      question: 'When should I arrive at the bus station?',
      answer: 'Travelers must reach the bus station 45 minutes before the departure time.',
    },
  ],
  payment: [
    {
      question: 'How do I make sure about the payment details and booking confirmation status?',
      answer: 'You will receive your confirmation email or SMS depending on the info you provided after the booking is confirmed.',
    },
    {
      question: 'What should I do if I do not receive the booking confirmation message after payment?',
      answer: 'You will get a confirmation email once your booking is confirmed. This should only take about two minutes but sometimes can take longer. Check your spam/junk mail folders. If you still have not received anything, contact our Customer Service team.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept VISA, MASTER, MPU, WaveMoney, KBZPay, CBPay, and MABPay.',
    },
  ],
  cancellation: [
    {
      question: 'Can I cancel my bus tickets?',
      answer: 'MMBusTicket will not refund for cancelled tickets. All tickets bought are non-refundable and non-exchangeable.',
    },
    {
      question: 'Can I receive a refund for my ticket?',
      answer: 'In case the bus is cancelled due to weather conditions, force majeure or natural disaster, it depends on the individual policy of the bus operators. Some operators allow refunds, while others do not. Please call 09 777 111 811 for all cancellation related queries.',
    },
  ],
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-orange-500 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-slate-300 text-sm leading-relaxed animate-slide-up">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              How can we help you?
            </h1>
            <p className="text-slate-400 text-lg">
              We are here to help with any questions or concerns.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <a
              href="tel:09777111811"
              className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Phone className="h-7 w-7 text-orange-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Please call us at</p>
                  <p className="text-xl font-bold text-white">09 777 111 811</p>
                </div>
              </div>
            </a>

            <a
              href="https://m.me/MMBusTicket"
              target="_blank"
              rel="noopener"
              className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-teal-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                  <MessageCircle className="h-7 w-7 text-teal-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Chat with our support team</p>
                  <p className="text-xl font-bold text-white">Messenger Chat</p>
                </div>
              </div>
            </a>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {/* Booking FAQs */}
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                <Calendar className="h-5 w-5 text-orange-500" />
                Booking FAQs
              </h2>
              <div className="space-y-3">
                {faqs.booking.map((faq, i) => (
                  <FAQItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>

            {/* Payment FAQs */}
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                <CreditCard className="h-5 w-5 text-teal-500" />
                Payment FAQs
              </h2>
              <div className="space-y-3">
                {faqs.payment.map((faq, i) => (
                  <FAQItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>

            {/* Cancellation FAQs */}
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                <XCircle className="h-5 w-5 text-red-500" />
                Cancellation FAQs
              </h2>
              <div className="space-y-3">
                {faqs.cancellation.map((faq, i) => (
                  <FAQItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-400 mb-2">Important Notes</h3>
                <ul className="text-sm text-amber-200 space-y-2">
                  <li>Always check your booking details before confirming payment.</li>
                  <li>Keep your booking reference handy when contacting support.</li>
                  <li>Foreign travellers may need additional travel documents for certain routes.</li>
                  <li>Bus operators have their own terms and conditions for changes and cancellations.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
