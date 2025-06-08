
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactHeader } from "@/components/ContactHeader";
import { ContactForm } from "@/components/ContactForm";
import { ContactInfo } from "@/components/ContactInfo";
import { WhyChooseUs } from "@/components/WhyChooseUs";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <ContactHeader />

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <ContactForm />

            <div className="space-y-8">
              <ContactInfo />
              <WhyChooseUs />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
