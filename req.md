# Project Title

# MedAssist: Audio-Visual System for Medication and Health Support

# Abstract

```
This project develops a comprehensive mobile and web-based health education and follow-up
system to improve treatment adherence and patient engagement, particularly in semi-urban
areas. Addressing challenges like low literacy, memory lapses, and language barriers, the
system automates personalized health information delivery via SMS and app notifications.
Key features include medication and appointment reminders (with special alerts for pregnant
women and children), and a speech-to-text engine that transcribes doctors’ spoken
instructions into readable SMS and printable formats. An intuitive, emoji-based, color-coded
medicine schedule, showing tablet size, shape, and color, aids patient understanding. Secure
storage of health documents like lab reports, X-rays, and prescriptions is supported, while
doctors can monitor patient status through phone numbers, respond to queries, and securely
share medical history with other professionals. The system integrates NLP to enhance user
interaction and automate health query responses. Both digital (Android app) and paper-based
options ensure maximum inclusivity. By combining automation, visual aids, multilingual
support, and intuitive design, the solution improves compliance, reduces confusion, eases
healthcare providers’ workload, and enhances overall healthcare delivery.
```
# Introduction

Many patients, especially in semi-urban and urban areas, struggle to follow their medication
schedules and medical advice correctly. Problems like low literacy, forgetting instructions,
and language barriers often cause confusion and lead to missed treatments. To solve this,
there is a need for a system that can guide patients clearly and remind them regularly, even if
they don’t have a smartphone or internet. This project aims to build a mobile and web-based
platform that helps patients stick to their treatment plans more easily. It sends medication and
appointment reminders through SMS and app notifications. Special attention is given to
pregnant women and children by reminding them about important injections and checkups.
Doctors’ spoken instructions are converted into simple text messages, which can also be
printed if needed. The system uses an emoji-based and color-coded medicine schedule,


showing tablet size, shape, and color to make it easy for all patients to understand.

Health documents like lab reports and prescriptions can be stored securely, and doctors can
monitor patient status, answer, questions, and safely share patient records when necessary.
Natural Language Processing (NLP) helps the system understand and reply to patient health
queries automatically. Both app-based and paper-based options are provided to include
patients who are not comfortable with smartphones. By using automation, visual aids, and
local languages, this project hopes to improve treatment success, reduce confusion, and
lighten the workload for healthcare provider.

# Objectives

# • Improve patient adherence by ensuring they follow medication schedules and

```
appointments correctly, even for low-literacy users, using simple reminders and
```
# SMS-based communication.

# • Convert doctor’s spoken instructions into clear, readable, multilingual text and SMS,

# bridging communication gaps especially for semi-urban and rural patients.

# • Support non-smartphone users by delivering important medical updates, follow-up

```
reminders, and health education through SMS, keeping healthcare accessible without
```
# internet reliance.

# • Enable seamless doctor-patient interaction through an app and web platform where

```
doctors can track patient status, update instructions, and automate follow-up
```
# notifications.

# • Deliver health education materials in simple, visual, and emoji-based formats to make

# medicine guides understandable for people of all age groups and literacy levels.

# • Ensure secure storage and retrieval of health documents like lab reports and X-rays,

# while allowing authorized sharing of medical history between doctors when needed.


# • Integrate AI and NLP technologies to automatically understand patient queries,

```
respond appropriately, and automate common tasks like appointment and medicine
reminders, reducing the doctor’s workload.
```
# • Provide both paper-based and digital health instructions to ensure maximum

# inclusivity for patients who prefer or require physical documentation.

# • Design a low-cost, scalable healthcare system that supports maternal and child care

# with specialized reminders, while remaining adaptable for clinics of all sizes.

# SOFTWARE AND HARDWARE REQUIREMENTS:

# Software requirements:

# • Frontend (Mobile App & Web App):

# • Android Studio (for mobile app development)

# • ReactJS / Angular (for web development)

# • Flutter (optional if you want cross-platform mobile app)

# • Backend (Server-Side Development):

# • Node.js / Django / Flask (for building APIs)

# • Firebase (optional for quick backend and push notifications)

# • MySQL / MongoDB (for database storage)

# • APIs and Libraries:

# • Twilio API or any SMS gateway API (for sending SMS)

# • Google Speech-to-Text API (for converting doctor instructions to text)

# • NLP Libraries: spaCy / NLTK / Dialogflow (for query understanding)

# • Cloud Storage (AWS S3 / Google Cloud Storage) for storing health documents

```
securely
```
# • Authentication: Firebase Authentication / OAuth (for user login and security)


# • Other Tools:

# • GitHub / GitLab (for code version control)

# • Figma / Adobe XD (for UI/UX design)

## Hardware Requirements:

# • For Development Team:

# • Laptop/PC (minimum specs):

```
o Processor: Intel i5 or higher / AMD Ryzen 5 or higher o
RAM: 8 GB (recommended 16 GB)
o Storage: 256 GB SSD (recommended) + 1 TB HDD (optional) o
Graphics Card: Not mandatory, but good for faster app building
if available
```
# • For Server Hosting:

# • Cloud Server (AWS, Azure, or Google Cloud)

# • Minimum 2 vCPU and 4 GB RAM instance o

# • Storage: 50–100 GB SSD (scalable based on users) o

# • SSL Certificate for secure communication

# • For End Users (Doctors/Patients):

# • Android smartphone (basic model for app users)

# • Basic feature phone (for SMS-only users )


# System Methodology

**1. Data Collection Layer**
    - Doctor's voice is recorded during the consultation using a mobile or web application.
    - The recorded audio file is securely sent to the backend server via an API.
**2. Speech-to-Text Conversion Layer**
    - The backend server receives the audio and uses Vosk API (offline) or Google Speech-
       toText API (online) to transcribe the spoken instructions into text format.
    - The transcription is processed in near real-time to minimize delays.
**3. Information Extraction and Formatting Layer**
    - Natural Language Processing (NLP) models like spaCy and rule-based parsing are
       applied to extract:
    - Medicine names
    - Dosage instructions
    - Timings to take medicines
    - Next consultation date
    - The extracted information is formatted into a clear, patient-friendly message.
    - For illiterate patients, icon-based schedules (pill shapes, colors, emoji timings) are
       generated by mapping the text to emojis using dictionary or mapper.
**4. Notification and Delivery Layer**
    - The formatted message and digital prescription are sent to the patient's phone via:
    - SMS using Twilio, Gupshup, or Fast2SMS
    - A copy is also saved in the app for future reference.
**5. Storage and Reminders Layer**
    - The patient's health data (prescription, reminders, consultation history) is securely
       stored in the database.
    - Automated reminders are scheduled for:
       i. Medicine intake times
       ii. Next consultation appointment
    - Special alerts (e.g., vaccination dates for pregnant women and children)


**6. Doctor and Admin Portal Layer**
Doctors can:
    - View patient history
    - Edit prescriptions if needed
    - Monitor patient adherence

# Flow Diagram:

```
Fig: System Flow Diagram
```
# Project Scope

**1. Platform Coverage**
    - Develop both mobile (Android) and web applications for patients and doctors.
    - Include SMS-based services for patients without smartphones.


**2. User Roles**
    - Doctors: Can log in, record and send voice instructions, monitor patient status, and
       share health history.
    - Patients: Can receive reminders, view medicine schedules, access health records, and
       ask queries via chatbot.
**3. Reminders & Notifications**
    - Medication, injection, and appointment reminders via app notifications and SMS.
**4. Voice-to-Text Conversion**
    - Doctor’s voice instructions are transcribed using speech-to-text APIs and sent as
       readable SMS or app messages.
**5. NLP & Chatbot Integration**
    - Use Natural Language Processing to enable patients to ask health-related questions and
       get understandable answers.
**6. Visual and Language Support**
    - Use of emoji-based schedules, color-coded medicine icons, and regional language
       support for better understanding.
**7. Secure Health Document Management**
    - Store and retrieve medical reports, prescriptions, and images securely via cloud storage.
**8. Accessibility Focus**
    - Design app for low-literacy users, with options for paper printouts, SMS, and visual aids


# Expected Outcomes

**1. Increased Treatment Adherence:** Patients will take medications on time and attend
    appointments regularly.
**2. Better Communication Between Doctors and Patients:** Simplified instructions
    through voice-to-text, chat, and visual tools reduce confusion.
**3. Inclusivity for Non-Smartphone Users:** SMS-based system ensures health support
    even without internet access.
**4. Reduced Doctor Workload:** Automated reminders, document storage, and response
    systems save time for doctors.
**5. Improved Health Literacy:** Patients better understand their health conditions and
    treatment plans through simple explanations.
**6. Efficient Health Record Management:** Patients and doctors can access and share
    medical data securely and quickly.
**7. Scalable Health Solution:** Can be deployed in clinics, health centers, and rural
    hospitals with minimal cost.
**8. Early Detection of Non-Adherence:** Doctors can identify when a patient misses a
    dose or appointment and follow up.
**9. Cost-Effective Healthcare:** Through discount alerts and fewer missed treatments, the
    overall health expense is reduced.


