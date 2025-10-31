"use client"

import React from "react"

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Terms & Conditions</h1>
      <p className="text-lg mb-8 text-center text-muted-foreground">Last updated: October 31, 2025</p>

      <div className="prose prose-lg max-w-none">
        <p className="mb-6 text-justify">
          Welcome to MedAssist ("we," "our," or "us"). These Terms & Conditions ("Terms") constitute a legally binding agreement between you and MedAssist regarding your access to and use of our website, mobile applications, and related services (collectively, the "Services"). By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use our Services.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">1. Definitions</h2>
        <p className="mb-4">
          For the purposes of these Terms:
        </p>
        <ul className="list-disc pl-8 mb-6">
          <li><strong>"User"</strong> means any individual who accesses or uses our Services, including patients, doctors, and administrators.</li>
          <li><strong>"Patient"</strong> means a User who seeks medical consultation through our platform.</li>
          <li><strong>"Doctor"</strong> means a licensed healthcare professional who provides medical services through our platform.</li>
          <li><strong>"Administrator"</strong> means authorized personnel who manage the platform and user accounts.</li>
          <li><strong>"Content"</strong> means any text, images, audio, video, or other materials uploaded, posted, or transmitted through our Services.</li>
          <li><strong>"Medical Records"</strong> means any health-related information, documents, or files uploaded by Users.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-12 mb-4">2. Eligibility and Account Registration</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">2.1 Age Requirements</h3>
        <p className="mb-4">
          You must be at least 18 years old and have the legal capacity to enter into binding agreements to use our Services. If you are under 18, you may only use our Services under the supervision of a parent or legal guardian who agrees to these Terms.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">2.2 Account Creation</h3>
        <p className="mb-4">
          To access certain features of our Services, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">2.3 Doctor Verification</h3>
        <p className="mb-4">
          Doctors must provide valid professional credentials, including but not limited to medical licenses, certifications, and qualifications. MedAssist reserves the right to verify credentials through third-party services and may suspend or terminate accounts that fail verification or are found to contain false information.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">2.4 Administrator Access</h3>
        <p className="mb-4">
          Administrators are granted access by MedAssist and must maintain the confidentiality of administrative credentials. Administrators are responsible for ensuring compliance with these Terms and applicable laws.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">3. Services Description</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">3.1 Platform Overview</h3>
        <p className="mb-4">
          MedAssist provides a digital healthcare platform that facilitates communication between patients and healthcare providers, appointment scheduling, medical record management, medication tracking, and related healthcare services.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">3.2 Medical Services</h3>
        <p className="mb-4">
          Our platform enables Patients to connect with Doctors for virtual consultations, upload medical records, receive prescriptions, and manage their healthcare. Doctors can manage patient relationships, review medical records, provide consultations, and issue prescriptions through the platform.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">3.3 Administrative Functions</h3>
        <p className="mb-4">
          Administrators may access user accounts, manage platform settings, verify doctor credentials, and perform other administrative tasks necessary for platform operation.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">4. User Responsibilities and Conduct</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">4.1 General Obligations</h3>
        <p className="mb-4">
          All Users agree to use the Services in accordance with applicable laws and regulations. You must not use the Services for any unlawful purpose or in any way that could harm, disable, overburden, or impair our servers or networks.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">4.2 Patient Responsibilities</h3>
        <p className="mb-4">
          Patients are responsible for providing accurate medical information, following prescribed treatments, and maintaining regular communication with their healthcare providers. Patients must not misrepresent their medical conditions or use the platform to obtain controlled substances inappropriately.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">4.3 Doctor Responsibilities</h3>
        <p className="mb-4">
          Doctors must provide competent medical care in accordance with professional standards and applicable laws. Doctors are responsible for maintaining patient confidentiality, obtaining informed consent, and documenting medical interactions appropriately. Doctors must not provide care outside their scope of practice or license.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">4.4 Prohibited Activities</h3>
        <p className="mb-4">
          You agree not to:
        </p>
        <ul className="list-disc pl-8 mb-6">
          <li>Upload or transmit any illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive content</li>
          <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
          <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
          <li>Use any robot, spider, scraper, or other automated means to access the Services</li>
          <li>Attempt to gain unauthorized access to any portion of the Services</li>
          <li>Use the Services to transmit viruses, malware, or other harmful code</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon the intellectual property rights of others</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-12 mb-4">5. Appointments and Consultations</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">5.1 Appointment Scheduling</h3>
        <p className="mb-4">
          Patients may request appointments with Doctors through the platform. Appointment requests are subject to Doctor availability and acceptance. MedAssist does not guarantee appointment availability or acceptance.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">5.2 Consultation Services</h3>
        <p className="mb-4">
          Virtual consultations are conducted through the platform's communication tools. All consultations are recorded for quality assurance and legal purposes. Patients and Doctors must ensure they have appropriate privacy and technical capabilities for consultations.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">5.3 Cancellation and Rescheduling</h3>
        <p className="mb-4">
          Appointments may be cancelled or rescheduled according to policies set by individual Doctors. Patients should review cancellation policies before booking. Repeated cancellations may result in restrictions on future bookings.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">5.4 Emergency Situations</h3>
        <p className="mb-4">
          Our Services are not intended for emergency medical situations. In case of medical emergencies, Users should immediately contact emergency services (such as calling 911 in the United States) rather than using our platform.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">6. Medical Records and Data Management</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">6.1 File Uploads</h3>
        <p className="mb-4">
          Users may upload medical records, images, audio recordings, and other healthcare-related files. All uploads are stored securely in cloud storage. Users retain ownership of their uploaded content but grant MedAssist a license to store and process such content for service provision.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">6.2 Data Accuracy</h3>
        <p className="mb-4">
          Users are responsible for ensuring the accuracy and completeness of information they provide. MedAssist is not responsible for errors in user-provided data or for medical decisions based on inaccurate information.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">6.3 Data Retention</h3>
        <p className="mb-4">
          Medical records and consultation data are retained in accordance with applicable healthcare regulations and data retention policies. Users may request deletion of their data subject to legal requirements and ongoing treatment needs.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">6.4 Data Sharing</h3>
        <p className="mb-4">
          Patient data may be shared with authorized healthcare providers involved in their care. Data sharing is governed by applicable privacy laws and user consent preferences.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">7. Prescriptions and Medication Management</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">7.1 Prescription Issuance</h3>
        <p className="mb-4">
          Doctors may issue prescriptions through the platform. All prescriptions are subject to applicable pharmacy and regulatory requirements. MedAssist does not dispense medications and is not responsible for prescription fulfillment.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">7.2 Medication Tracking</h3>
        <p className="mb-4">
          The platform provides medication tracking and reminder features. Users are responsible for actually taking medications as prescribed and should not rely solely on platform reminders.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">7.3 Controlled Substances</h3>
        <p className="mb-4">
          Prescriptions for controlled substances are subject to additional regulatory requirements. Doctors must comply with all applicable laws regarding controlled substance prescribing.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">8. Payment Terms</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">8.1 Fees</h3>
        <p className="mb-4">
          Certain Services may require payment. Fees are disclosed at the time of service and are non-refundable except as required by law or as specified in our refund policy.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">8.2 Billing</h3>
        <p className="mb-4">
          Users agree to provide accurate billing information and authorize automatic charges for recurring services. Failed payments may result in service suspension.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">8.3 Taxes</h3>
        <p className="mb-4">
          All fees are exclusive of applicable taxes, which will be added to invoices as required by law.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">9. Intellectual Property</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">9.1 Platform Content</h3>
        <p className="mb-4">
          The Services and their original content, features, and functionality are owned by MedAssist and are protected by copyright, trademark, and other intellectual property laws.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">9.2 User Content</h3>
        <p className="mb-4">
          Users retain ownership of content they upload but grant MedAssist a worldwide, non-exclusive, royalty-free license to use, store, and process such content for service provision.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">9.3 Trademarks</h3>
        <p className="mb-4">
          MedAssist and related logos are trademarks of MedAssist. Users may not use these trademarks without prior written permission.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">10. Privacy and Data Protection</h2>
        <p className="mb-4">
          Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our Services, you consent to the collection and use of your information as outlined in our Privacy Policy.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">11. Disclaimers and Limitations of Liability</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">11.1 Medical Disclaimer</h3>
        <p className="mb-4">
          MedAssist is not a healthcare provider and does not provide medical advice, diagnosis, or treatment. All medical services are provided by licensed healthcare professionals. MedAssist makes no warranties regarding the quality, accuracy, or effectiveness of medical services provided through the platform.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">11.2 Platform Availability</h3>
        <p className="mb-4">
          While we strive to provide reliable Services, we do not guarantee uninterrupted or error-free operation. The Services are provided "as is" and "as available" without warranties of any kind.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">11.3 Limitation of Liability</h3>
        <p className="mb-4">
          To the maximum extent permitted by law, MedAssist shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services. Our total liability shall not exceed the amount paid by you for the Services in the twelve months preceding the claim.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">12. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify and hold harmless MedAssist, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Services, violation of these Terms, or infringement of any rights of another party.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">13. Termination</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">13.1 Termination by User</h3>
        <p className="mb-4">
          You may terminate your account at any time by contacting support or using account settings. Termination will not affect rights and obligations that arose prior to termination.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">13.2 Termination by MedAssist</h3>
        <p className="mb-4">
          We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">13.3 Effect of Termination</h3>
        <p className="mb-4">
          Upon termination, your right to use the Services ceases immediately. We may delete your account and data in accordance with our data retention policies and applicable laws.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">14. Dispute Resolution</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">14.1 Informal Resolution</h3>
        <p className="mb-4">
          Before initiating formal dispute resolution, you agree to first contact us at support@medassist.com to seek an informal resolution.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">14.2 Binding Arbitration</h3>
        <p className="mb-4">
          Any disputes arising from these Terms or your use of the Services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in [Your Jurisdiction].
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">14.3 Class Action Waiver</h3>
        <p className="mb-4">
          You agree to resolve disputes only on an individual basis and waive your right to participate in class actions or representative proceedings.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">15. Governing Law</h2>
        <p className="mb-4">
          These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts of [Your Jurisdiction].
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">16. Force Majeure</h2>
        <p className="mb-4">
          MedAssist shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">17. Severability</h2>
        <p className="mb-4">
          If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall remain in full force and effect.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">18. Entire Agreement</h2>
        <p className="mb-4">
          These Terms, together with our Privacy Policy and any other legal notices published by us on the Services, constitute the entire agreement between you and MedAssist concerning the Services.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4">19. Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right to modify these Terms at any time. We will notify users of material changes by email or through the Services. Your continued use of the Services after such notification constitutes acceptance of the modified Terms.
        </p>
        <p className="text-sm text-muted-foreground mt-12">
          These Terms were last updated on October 31, 2025. By continuing to use our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
        </p>
      </div>
    </div>
  )
}
