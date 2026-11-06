(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Translations ---------- */
var T={
en:{
nav_about:'About',nav_research:'Research',nav_experience:'Experience',nav_pubs:'Publications',nav_skills:'Skills',nav_edu:'Education',nav_contact:'Contact',
hero_eyebrow:'Researcher · R&D Engineer',hero_hi:"Hi, I'm",status:'Open to R&D roles & collaborations',fl_q1:'Q1 journals',copy:'Copy email',copied:'Email copied to clipboard',
hero_lead:'I engineer next-generation thin-film solar cells. My work on MoS₂ and CZTS lifted simulated cell efficiency from 8.42% to 11.43%, and I turn lab data into clean, sustainable energy.',
hero_cta1:'View Publications',hero_cta2:'Get in touch',badge_eff:'simulated efficiency',badge_q1:'journals',
st_pubs:'Publications',st_cites:'Citations',st_years:'Years in research',st_tech:'Lab techniques',
about_h:'About me',
about_p1:"I'm a researcher and R&D engineer focused on thin-film photovoltaics and 2D materials. I recently completed my MSc in Electronic Engineering at Universiti Tenaga Nasional (UNITEN), Malaysia, where I worked as a full-time Research Assistant at the Institute of Sustainable Energy.",
about_p2:'I combine hands-on fabrication and characterisation with device-level simulation, so ideas move from the model to the lab and back with evidence at every step.',
about_p3:"I'm looking for R&D engineering roles in industry and academia where I can contribute to measurable results and keep learning.",
facts_h:'Quick facts',f_loc:'Based in',f_loc_v:'Labonchara, Khulna, Bangladesh',f_deg:'Degree',f_deg_v:'MSc Electronic Engineering (2025)',f_focus:'Focus',f_focus_v:'Thin-film PV · MoS₂ · CZTS',f_lang:'Languages',f_lang_v:'Bangla · English',f_mail:'Email',
res_h:'Research focus',hl_tag:'Featured result',hl_h:'p-type MoS₂ back contact lifts CZTS efficiency by 36%',
hl_p:'Using SCAPS-1D modelling, a p-type MoS₂ interlayer improved the open-circuit voltage from 0.569 V to 0.665 V and the fill factor from 64.76% to 73.07%. The baseline device rose from 8.42% to 11.43% efficiency.',
read_paper:'Read the paper →',bar1:'Baseline CZTS',bar2:'With p-type MoS₂',bar3:'With n-type MoS₂',
r1_h:'MoS₂ thin-film synthesis',r1_p:'Sulfurization of molybdenum films. I study how temperature, chamber pressure and time shape crystallinity, defects and electronic properties.',
r2_h:'CZTS solar-cell simulation',r2_p:'Device-level modelling in SCAPS-1D to see how MoS₂ interlayers and defects change carrier transport and photovoltaic performance.',
r3_h:'Sustainable energy bike lanes',r3_p:'Research on energy-harvesting bicycle lanes for Kuala Lumpur, a smart-city project funded under the NSF and U.S. State Department programme.',
exp_h:'Experience',ft:'Full-time',pt:'Part-time',
e1_role:'Research Assistant — Developing Solar Cells',
e1_a:'Researched MoS₂ transition-metal dichalcogenide thin films, studying how sulfurization parameters and chamber pressure affect structural, optical and electronic properties.',
e1_b:'Designed and optimised fabrication processes to improve crystallinity and control defects for optoelectronic and photovoltaic use.',
e1_c:'Characterised materials with XRD, Raman, FESEM, photoluminescence and Hall effect to link structure with properties.',
e1_d:'Simulated CZTS solar cells in SCAPS-1D and evaluated the effect of MoS₂ interlayers on carrier transport and performance.',
e1_e:'Co-authored peer-reviewed journal papers, supervised lab activities and collaborated with international researchers.',
e2_role:'Research Assistant — Sustainable Energy Bike Lanes',
e2_a:'Supported research on renewable energy in smart transport infrastructure and on the energy-harvesting bike-lane process.',
e2_b:'Collected and analysed energy-generation data from cycling infrastructure in Kuala Lumpur.',
e2_c:'Worked in a multidisciplinary team on feasibility, reports and presentations for stakeholders.',
pub_h:'Publications',fl_all:'All',fl_j:'Journals',fl_c:'Conference',all_scholar:'See all on Google Scholar →',
sk_h:'Skills & lab techniques',sk1:'Characterisation & lab',sk2:'Simulation & software',sk3:'Programming & tools',
edu_h:'Education & certifications',
d1_h:'MSc in Electronic Engineering',d1_p:'Major: Electronics and Materials Engineering · Minor: Electrical',
d2_h:'BSc in Electrical & Electronic Engineering',d2_p:'Major: Electrical Power and Mathematics · Minor: Electronics, Chemistry',
cert_h:'Conferences & seminars',
c1:'International Conference on Sustainable Energy, Infrastructure and Environment — Putrajaya, Malaysia',
c2:'International Conference on Sustainable Energy and Green Technology — Bangkok, Thailand',
c3:'X-ray Metrology Solutions for Semiconductor and Electronic Devices seminar — MIMOS Berhad, Kuala Lumpur',
c4:'MIMOS High-Value Semiconductor Technology Seminar: ANSYS CAE Solution — Malaysia',
c5:'Training: solar cell fabrication and characterisation (HiCOE, UNITEN) and thin-film PZT cell soldering (NSF project, UNITEN)',
ct_h:"Let's work together",ct_p:'Open to R&D engineering roles, research collaborations and PhD opportunities in solar energy and thin-film materials.',ct_mail:'Send an email',
foot:'Designed & built with care.',top:'Back to top ↑',
cited:'Cited by',open:'Open paper',typed:['Thin-Film Photovoltaics','MoS₂ & CZTS Solar Cells','2D Materials Researcher','Clean Energy Engineer']
},
bn:{
nav_about:'পরিচিতি',nav_research:'গবেষণা',nav_experience:'অভিজ্ঞতা',nav_pubs:'প্রকাশনা',nav_skills:'দক্ষতা',nav_edu:'শিক্ষা',nav_contact:'যোগাযোগ',
hero_eyebrow:'গবেষক · আর অ্যান্ড ডি ইঞ্জিনিয়ার',hero_hi:'আমি',status:'আর অ্যান্ড ডি কাজ ও সহযোগিতার জন্য প্রস্তুত',fl_q1:'Q1 জার্নাল',copy:'ইমেইল কপি করুন',copied:'ইমেইল কপি হয়েছে',
hero_lead:'আমি পরবর্তী প্রজন্মের থিন-ফিল্ম সোলার সেল নিয়ে কাজ করি। MoS₂ ও CZTS নিয়ে আমার গবেষণায় সিমুলেটেড সেলের দক্ষতা ৮.৪২% থেকে বেড়ে ১১.৪৩% হয়েছে। ল্যাবের তথ্যকে আমি পরিষ্কার ও টেকসই শক্তিতে রূপ দিই।',
hero_cta1:'প্রকাশনা দেখুন',hero_cta2:'যোগাযোগ করুন',badge_eff:'সিমুলেটেড দক্ষতা',badge_q1:'জার্নাল',
st_pubs:'প্রকাশনা',st_cites:'সাইটেশন',st_years:'গবেষণার বছর',st_tech:'ল্যাব টেকনিক',
about_h:'আমার পরিচয়',
about_p1:'আমি থিন-ফিল্ম ফটোভোলটাইক ও ২ডি ম্যাটেরিয়ালস নিয়ে কাজ করা একজন গবেষক ও আর অ্যান্ড ডি ইঞ্জিনিয়ার। সম্প্রতি মালয়েশিয়ার Universiti Tenaga Nasional (UNITEN) থেকে ইলেকট্রনিক ইঞ্জিনিয়ারিংয়ে এমএসসি শেষ করেছি। সেখানে Institute of Sustainable Energy-তে ফুল-টাইম রিসার্চ অ্যাসিস্ট্যান্ট ছিলাম।',
about_p2:'আমি হাতে-কলমে ফ্যাব্রিকেশন ও ক্যারেক্টারাইজেশনের সঙ্গে ডিভাইস-স্তরের সিমুলেশন মেলাই। ফলে প্রতিটি ধাপে প্রমাণসহ মডেল থেকে ল্যাবে আর ল্যাব থেকে আবার মডেলে ফেরা যায়।',
about_p3:'আমি ইন্ডাস্ট্রি ও একাডেমিয়ায় আর অ্যান্ড ডি ইঞ্জিনিয়ারিং কাজ খুঁজছি, যেখানে পরিমাপযোগ্য ফলাফলে অবদান রাখতে পারব এবং শিখতে থাকব।',
facts_h:'সংক্ষেপে',f_loc:'অবস্থান',f_loc_v:'লবণচরা, খুলনা, বাংলাদেশ',f_deg:'ডিগ্রি',f_deg_v:'ইলেকট্রনিক ইঞ্জিনিয়ারিংয়ে এমএসসি (২০২৫)',f_focus:'গবেষণার বিষয়',f_focus_v:'থিন-ফিল্ম পিভি · MoS₂ · CZTS',f_lang:'ভাষা',f_lang_v:'বাংলা · ইংরেজি',f_mail:'ইমেইল',
res_h:'গবেষণার ক্ষেত্র',hl_tag:'বিশেষ ফলাফল',hl_h:'p-type MoS₂ ব্যাক কন্টাক্টে CZTS-এর দক্ষতা ৩৬% বেড়েছে',
hl_p:'SCAPS-1D মডেলিংয়ে p-type MoS₂ ইন্টারলেয়ার ব্যবহার করে ওপেন-সার্কিট ভোল্টেজ ০.৫৬৯ V থেকে ০.৬৬৫ V এবং ফিল ফ্যাক্টর ৬৪.৭৬% থেকে ৭৩.০৭% হয়েছে। বেসলাইন ডিভাইসের দক্ষতা ৮.৪২% থেকে বেড়ে ১১.৪৩% হয়েছে।',
read_paper:'পেপারটি পড়ুন →',bar1:'বেসলাইন CZTS',bar2:'p-type MoS₂ সহ',bar3:'n-type MoS₂ সহ',
r1_h:'MoS₂ থিন-ফিল্ম সংশ্লেষণ',r1_p:'মলিবডেনাম ফিল্মের সালফারাইজেশন। তাপমাত্রা, চেম্বার প্রেশার ও সময় কীভাবে ক্রিস্টালিনিটি, ত্রুটি ও ইলেকট্রনিক ধর্মকে প্রভাবিত করে তা নিয়ে কাজ করি।',
r2_h:'CZTS সোলার সেল সিমুলেশন',r2_p:'SCAPS-1D-তে ডিভাইস-স্তরের মডেলিং। MoS₂ ইন্টারলেয়ার ও ত্রুটি কীভাবে ক্যারিয়ার পরিবহন ও ফটোভোলটাইক কার্যক্ষমতা বদলায় তা দেখি।',
r3_h:'টেকসই শক্তির বাইক লেন',r3_p:'কুয়ালালামপুরের জন্য শক্তি-সংগ্রাহী সাইকেল লেন নিয়ে গবেষণা। এটি NSF ও মার্কিন পররাষ্ট্র দপ্তরের অর্থায়নে একটি স্মার্ট-সিটি প্রকল্প।',
exp_h:'অভিজ্ঞতা',ft:'ফুল-টাইম',pt:'পার্ট-টাইম',
e1_role:'রিসার্চ অ্যাসিস্ট্যান্ট — সোলার সেল উন্নয়ন',
e1_a:'MoS₂ ট্রানজিশন-মেটাল ডাইক্যালকোজেনাইড থিন-ফিল্ম নিয়ে গবেষণা করেছি। সালফারাইজেশন প্যারামিটার ও চেম্বার প্রেশার কীভাবে গঠন, আলোকীয় ও ইলেকট্রনিক ধর্মকে প্রভাবিত করে তা দেখেছি।',
e1_b:'অপটোইলেকট্রনিক ও ফটোভোলটাইক ব্যবহারের জন্য ক্রিস্টালিনিটি বাড়াতে ও ত্রুটি নিয়ন্ত্রণে ফ্যাব্রিকেশন প্রক্রিয়া ডিজাইন ও অপটিমাইজ করেছি।',
e1_c:'XRD, রামান, FESEM, ফটোলুমিনেসেন্স ও হল ইফেক্ট দিয়ে উপাদানের গঠন ও ধর্মের সম্পর্ক বিশ্লেষণ করেছি।',
e1_d:'SCAPS-1D-তে CZTS সোলার সেল সিমুলেট করে ক্যারিয়ার পরিবহন ও কার্যক্ষমতায় MoS₂ ইন্টারলেয়ারের প্রভাব মূল্যায়ন করেছি।',
e1_e:'পিয়ার-রিভিউড জার্নাল পেপারের সহ-লেখক ছিলাম, ল্যাবের কাজ তত্ত্বাবধান করেছি এবং আন্তর্জাতিক গবেষকদের সঙ্গে কাজ করেছি।',
e2_role:'রিসার্চ অ্যাসিস্ট্যান্ট — টেকসই শক্তির বাইক লেন',
e2_a:'স্মার্ট পরিবহন অবকাঠামোতে নবায়নযোগ্য শক্তি এবং শক্তি-সংগ্রাহী বাইক-লেন তৈরির প্রক্রিয়া নিয়ে গবেষণায় সহায়তা করেছি।',
e2_b:'কুয়ালালামপুরের সাইকেল অবকাঠামো থেকে বিদ্যুৎ উৎপাদনের তথ্য সংগ্রহ ও বিশ্লেষণ করেছি।',
e2_c:'বহুবিষয়ক দলে কাজ করে সম্ভাব্যতা যাচাই, রিপোর্ট ও স্টেকহোল্ডারদের জন্য প্রেজেন্টেশন তৈরি করেছি।',
pub_h:'প্রকাশনা',fl_all:'সব',fl_j:'জার্নাল',fl_c:'কনফারেন্স',all_scholar:'গুগল স্কলারে সব দেখুন →',
sk_h:'দক্ষতা ও ল্যাব টেকনিক',sk1:'ক্যারেক্টারাইজেশন ও ল্যাব',sk2:'সিমুলেশন ও সফটওয়্যার',sk3:'প্রোগ্রামিং ও টুলস',
edu_h:'শিক্ষা ও সনদ',
d1_h:'ইলেকট্রনিক ইঞ্জিনিয়ারিংয়ে এমএসসি',d1_p:'মেজর: ইলেকট্রনিক্স ও ম্যাটেরিয়ালস ইঞ্জিনিয়ারিং · মাইনর: ইলেকট্রিক্যাল',
d2_h:'ইলেকট্রিক্যাল ও ইলেকট্রনিক ইঞ্জিনিয়ারিংয়ে বিএসসি',d2_p:'মেজর: ইলেকট্রিক্যাল পাওয়ার ও গণিত · মাইনর: ইলেকট্রনিক্স, রসায়ন',
cert_h:'কনফারেন্স ও সেমিনার',
c1:'টেকসই শক্তি, অবকাঠামো ও পরিবেশ বিষয়ক আন্তর্জাতিক কনফারেন্স — পুত্রাজায়া, মালয়েশিয়া',
c2:'টেকসই শক্তি ও গ্রিন টেকনোলজি বিষয়ক আন্তর্জাতিক কনফারেন্স — ব্যাংকক, থাইল্যান্ড',
c3:'সেমিকন্ডাক্টর ও ইলেকট্রনিক ডিভাইসের জন্য এক্স-রে মেট্রোলজি সমাধান সেমিনার — MIMOS Berhad, কুয়ালালামপুর',
c4:'MIMOS হাই-ভ্যালু সেমিকন্ডাক্টর টেকনোলজি সেমিনার: ANSYS CAE Solution — মালয়েশিয়া',
c5:'প্রশিক্ষণ: সোলার সেল ফ্যাব্রিকেশন ও ক্যারেক্টারাইজেশন (HiCOE, UNITEN) এবং থিন-ফিল্ম PZT সেল সোল্ডারিং (NSF প্রকল্প, UNITEN)',
ct_h:'চলুন একসঙ্গে কাজ করি',ct_p:'সোলার এনার্জি ও থিন-ফিল্ম ম্যাটেরিয়ালসে আর অ্যান্ড ডি ইঞ্জিনিয়ারিং কাজ, গবেষণা সহযোগিতা ও পিএইচডি সুযোগের জন্য আমি প্রস্তুত।',ct_mail:'ইমেইল পাঠান',
foot:'যত্ন নিয়ে ডিজাইন ও তৈরি।',top:'উপরে যান ↑',
cited:'সাইটেশন',open:'পেপার খুলুন',typed:['থিন-ফিল্ম ফটোভোলটাইক','MoS₂ ও CZTS সোলার সেল','২ডি ম্যাটেরিয়ালস গবেষক','ক্লিন এনার্জি ইঞ্জিনিয়ার']
},
ar:{
nav_about:'نبذة',nav_research:'الأبحاث',nav_experience:'الخبرات',nav_pubs:'المنشورات',nav_skills:'المهارات',nav_edu:'التعليم',nav_contact:'تواصل',
hero_eyebrow:'باحث · مهندس بحث وتطوير',hero_hi:'مرحباً، أنا',status:'متاح لفرص البحث والتطوير والتعاون',fl_q1:'مجلات Q1',copy:'انسخ البريد',copied:'تم نسخ البريد الإلكتروني',
hero_lead:'أعمل على تطوير الجيل القادم من الخلايا الشمسية رقيقة الأغشية. رفعت أبحاثي حول MoS₂ وCZTS كفاءة الخلية المحاكاة من 8.42% إلى 11.43%، وأحوّل بيانات المختبر إلى طاقة نظيفة ومستدامة.',
hero_cta1:'استعرض المنشورات',hero_cta2:'تواصل معي',badge_eff:'كفاءة بالمحاكاة',badge_q1:'مجلات',
st_pubs:'منشورات',st_cites:'استشهادات',st_years:'سنوات في البحث',st_tech:'تقنيات مخبرية',
about_h:'نبذة عني',
about_p1:'أنا باحث ومهندس بحث وتطوير، أركّز على الخلايا الكهروضوئية رقيقة الأغشية والمواد ثنائية الأبعاد. أنهيت مؤخراً درجة الماجستير في الهندسة الإلكترونية من جامعة تينجا الوطنية (UNITEN) في ماليزيا، حيث عملت مساعد باحث بدوام كامل في معهد الطاقة المستدامة.',
about_p2:'أجمع بين التصنيع والتوصيف العملي في المختبر ومحاكاة الأجهزة، فتنتقل الفكرة من النموذج إلى المختبر ثم تعود إليه مدعومة بالأدلة في كل خطوة.',
about_p3:'أبحث عن فرص في البحث والتطوير في الصناعة والأوساط الأكاديمية، أسهم فيها بنتائج قابلة للقياس وأواصل التعلّم.',
facts_h:'نبذة سريعة',f_loc:'مكان الإقامة',f_loc_v:'لابونشارا، خولنا، بنغلاديش',f_deg:'الدرجة العلمية',f_deg_v:'ماجستير الهندسة الإلكترونية (2025)',f_focus:'مجال التركيز',f_focus_v:'الخلايا الكهروضوئية رقيقة الأغشية · MoS₂ · CZTS',f_lang:'اللغات',f_lang_v:'البنغالية · الإنجليزية',f_mail:'البريد الإلكتروني',
res_h:'مجالات البحث',hl_tag:'نتيجة مميزة',hl_h:'طبقة MoS₂ من النوع p في الملامس الخلفي ترفع كفاءة CZTS بنسبة 36%',
hl_p:'باستخدام المحاكاة في SCAPS-1D، حسّنت طبقة MoS₂ من النوع p جهد الدارة المفتوحة من 0.569 إلى 0.665 فولت، وعامل الملء من 64.76% إلى 73.07%. وارتفعت كفاءة الخلية الأساسية من 8.42% إلى 11.43%.',
read_paper:'اقرأ البحث ←',bar1:'CZTS الأساسية',bar2:'مع MoS₂ من النوع p',bar3:'مع MoS₂ من النوع n',
r1_h:'تصنيع أغشية MoS₂ الرقيقة',r1_p:'كبرتة أغشية الموليبدينوم. أدرس كيف تؤثر درجة الحرارة وضغط الغرفة والزمن في البلورية والعيوب والخصائص الإلكترونية.',
r2_h:'محاكاة الخلايا الشمسية CZTS',r2_p:'نمذجة على مستوى الجهاز باستخدام SCAPS-1D لمعرفة كيف تغيّر الطبقات البينية من MoS₂ والعيوب انتقال الحاملات والأداء الكهروضوئي.',
r3_h:'مسارات الدراجات لتوليد الطاقة المستدامة',r3_p:'بحث في مسارات دراجات تولّد الطاقة لمدينة كوالالمبور، وهو مشروع مدينة ذكية بتمويل من برنامج مؤسسة العلوم الوطنية الأمريكية (NSF) ووزارة الخارجية الأمريكية.',
exp_h:'الخبرات',ft:'دوام كامل',pt:'دوام جزئي',
e1_role:'مساعد باحث — تطوير الخلايا الشمسية',
e1_a:'أجريت أبحاثاً على أغشية MoS₂ الرقيقة من فلزات الانتقال، ودرست تأثير معاملات الكبرتة وضغط الغرفة في الخصائص البنيوية والضوئية والإلكترونية.',
e1_b:'صمّمت عمليات التصنيع وحسّنتها لرفع البلورية والتحكم في العيوب لاستخدامها في التطبيقات الإلكترونية الضوئية والكهروضوئية.',
e1_c:'وصّفت المواد باستخدام XRD وطيف رامان وFESEM والتألق الضوئي وتأثير هول لربط البنية بالخصائص.',
e1_d:'حاكيت خلايا CZTS الشمسية في SCAPS-1D وقيّمت أثر الطبقات البينية من MoS₂ في انتقال الحاملات والأداء.',
e1_e:'شاركت في تأليف أبحاث محكّمة، وأشرفت على أنشطة المختبر، وتعاونت مع باحثين دوليين.',
e2_role:'مساعد باحث — مسارات الدراجات للطاقة المستدامة',
e2_a:'دعمت البحث في الطاقة المتجددة ضمن البنية التحتية الذكية للنقل، وفي آلية إنشاء مسارات دراجات تولّد الطاقة.',
e2_b:'جمعت وحلّلت بيانات توليد الطاقة من البنية التحتية للدراجات في كوالالمبور.',
e2_c:'عملت ضمن فريق متعدد التخصصات على دراسات الجدوى والتقارير والعروض المقدمة لأصحاب المصلحة.',
pub_h:'المنشورات',fl_all:'الكل',fl_j:'مجلات',fl_c:'مؤتمرات',all_scholar:'شاهد الكل على Google Scholar ←',
sk_h:'المهارات والتقنيات المخبرية',sk1:'التوصيف والعمل المخبري',sk2:'المحاكاة والبرمجيات',sk3:'البرمجة والأدوات',
edu_h:'التعليم والشهادات',
d1_h:'ماجستير في الهندسة الإلكترونية',d1_p:'التخصص الرئيسي: هندسة الإلكترونيات والمواد · الفرعي: الكهربائية',
d2_h:'بكالوريوس في الهندسة الكهربائية والإلكترونية',d2_p:'التخصص الرئيسي: القدرة الكهربائية والرياضيات · الفرعي: الإلكترونيات والكيمياء',
cert_h:'المؤتمرات والندوات',
c1:'المؤتمر الدولي للطاقة المستدامة والبنية التحتية والبيئة — بوتراجايا، ماليزيا',
c2:'المؤتمر الدولي للطاقة المستدامة والتقنيات الخضراء — بانكوك، تايلاند',
c3:'ندوة حلول القياس بالأشعة السينية لأشباه الموصلات والأجهزة الإلكترونية — MIMOS Berhad، كوالالمبور',
c4:'ندوة MIMOS لتقنيات أشباه الموصلات عالية القيمة: حلول ANSYS CAE — ماليزيا',
c5:'تدريب: تصنيع الخلايا الشمسية وتوصيفها (HiCOE، UNITEN) ولحام خلايا PZT الرقيقة (مشروع NSF، UNITEN)',
ct_h:'لنعمل معاً',ct_p:'أرحّب بفرص هندسة البحث والتطوير والتعاون البحثي وفرص الدكتوراه في الطاقة الشمسية ومواد الأغشية الرقيقة.',ct_mail:'أرسل بريداً إلكترونياً',
foot:'صُمّم وبُني بعناية.',top:'العودة للأعلى ↑',
cited:'استُشهد به',open:'افتح البحث',typed:['الخلايا الكهروضوئية رقيقة الأغشية','خلايا MoS₂ وCZTS الشمسية','باحث في المواد ثنائية الأبعاد','مهندس طاقة نظيفة']
}
};

/* ---------- Publications data ---------- */
var P=[
{y:2025,t:'Current scenario and future trends on stability issues of perovskite solar cells: A mini review',j:'Current Opinion in Colloid & Interface Science 76, 101895',q:'Q1',c:60,d:'10.1016/j.cocis.2025.101895',k:'journal'},
{y:2025,t:'Thermal modulation of crystallinity and defect landscape in sputtered MoS₂ thin films for optoelectronic applications',j:'Journal of Science: Advanced Materials and Devices, 101060',q:'Q1',c:5,d:'10.1016/j.jsamd.2025.101060',k:'journal'},
{y:2024,t:'A comprehensive modeling on MoS₂ interface and defect engineering in CZTS thin film solar cells',j:'Journal of Materials Research and Technology 33, 6601–6609',q:'Q1',c:22,d:'10.1016/j.jmrt.2024.11.016',k:'journal'},
{y:2024,t:'MoS₂ thin film hetero-interface as effective back surface field in CZTS-based solar cells',j:'Materials Science in Semiconductor Processing 182, 108721',q:'Q2',c:19,d:'10.1016/j.mssp.2024.108721',k:'journal'},
{y:2025,t:'Pressure-dependent sulfurization of molybdenum thin films for high-quality MoS₂ formation',j:'IOP Conf. Series: Earth and Environmental Science 1500, 012020',q:'Conf',c:1,d:'10.1088/1755-1315/1500/1/012020',k:'conf'},
{y:2025,t:'Modulating Molybdenum Disulfide (MoS₂) Thin Films Formation via Vapor-Phase Synthesis: Time Variation',j:'IOP Conf. Series: Earth and Environmental Science 1560, 012038',q:'Conf',c:0,d:'10.1088/1755-1315/1560/1/012038',k:'conf'}
];

var lang='en';
function render(){
  var box=$('#pubs');box.innerHTML='';
  P.forEach(function(p){
    var a=document.createElement('a');a.className='pub reveal in';a.href='https://doi.org/'+p.d;a.target='_blank';a.rel='noopener';a.dataset.k=p.k;a.dataset.q=p.q;
    var qc=p.q==='Q2'?'q q2':(p.q==='Conf'?'q cf':'q');
    a.innerHTML='<div class="yr">'+p.y+'</div><div><h3 dir="ltr"></h3><div class="meta" dir="ltr"></div><div class="row"><span class="'+qc+'">'+(p.q==='Conf'?({bn:'কনফারেন্স',ar:'مؤتمر',en:'Conference'}[lang]):p.q+({bn:' জার্নাল',ar:' مجلة',en:' Journal'}[lang]))+'</span>'+(p.c?'<span class="cite">'+T[lang].cited+' '+p.c+'</span>':'')+'<span class="cite" dir="ltr">DOI '+p.d+'</span></div></div><span class="go" aria-label="'+T[lang].open+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span>';
    $('h3',a).textContent=p.t;$('.meta',a).textContent=p.j;
    box.appendChild(a);
  });
  applyFilter();
}
var cur='all';
function applyFilter(){$$('.pub').forEach(function(e){e.style.display=(cur==='all'||e.dataset.k===cur||(cur==='q1'&&e.dataset.q==='Q1'))?'':'none'})}
$('#filters').addEventListener('click',function(e){var b=e.target.closest('.chipbtn');if(!b)return;cur=b.dataset.f;$$('.chipbtn').forEach(function(x){x.classList.toggle('active',x===b)});applyFilter()});

/* ---------- Language ---------- */
function setLang(l){
  lang=l;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';store.set('lang',l);
  $$('[data-i18n]').forEach(function(el){var v=T[l][el.dataset.i18n];if(v===undefined)v=T.en[el.dataset.i18n];if(v!==undefined)el.textContent=v});
  $$('#lang button').forEach(function(b){b.classList.toggle('on',b.dataset.l===l)});
  render();restartTyping();
}
$('#lang').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setLang(b.dataset.l)});

/* ---------- Theme ---------- */
$('#theme').addEventListener('click',function(){
  var n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',n);store.set('theme',n);
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content=n==='dark'?'#050b18':'#f5f8ff';
  initBg();
});

/* ---------- Typed ---------- */
var tmr,ti=0,ci=0,del=false;
function tick(){
  var words=T[lang].typed,w=words[ti%words.length],el=$('#typed');
  ci+=del?-1:1;el.textContent=w.slice(0,ci);
  var d=del?35:75;
  if(!del&&ci===w.length){del=true;d=1400}else if(del&&ci===0){del=false;ti++;d=300}
  tmr=setTimeout(tick,d);
}
function restartTyping(){clearTimeout(tmr);ti=0;ci=0;del=false;if(reduce){$('#typed').textContent=T[lang].typed[0];return}tick()}

/* ---------- Menu ---------- */
$('#menu').addEventListener('click',function(){$('#links').classList.toggle('open')});
$$('#links a').forEach(function(a){a.addEventListener('click',function(){$('#links').classList.remove('open')})});

/* ---------- Reveal + counters ---------- */
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  var n=$('[data-count]',e.target);if(n)count(n);
});},{threshold:.15});
function observe(){$$('.reveal').forEach(function(e){if(!e.classList.contains('in'))io.observe(e)})}
function count(n){
  var to=+n.dataset.count,suf=n.dataset.suffix||'';if(reduce){n.textContent=to+suf;return}
  var t0=performance.now();(function f(t){var p=Math.min((t-t0)/1400,1),v=Math.round(to*(1-Math.pow(1-p,3)));n.textContent=v+suf;if(p<1)requestAnimationFrame(f)})(t0);
}

/* ---------- Scroll progress + active link ---------- */
var secs=$$('main section[id]'),lnks=$$('#links a');
addEventListener('scroll',function(){
  var h=document.documentElement;$('#progress').style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
  var y=h.scrollTop+140,cur='';secs.forEach(function(s){if(s.offsetTop<=y)cur=s.id});
  lnks.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+cur)});
},{passive:true});

/* ---------- Cursor glow + tilt ---------- */
if(!reduce&&matchMedia('(pointer:fine)').matches){
  var g=$('#glow');addEventListener('mousemove',function(e){g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'});
  $$('.tilt').forEach(function(c){
    c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='perspective(800px) rotateY('+x*8+'deg) rotateX('+-y*8+'deg) translateY(-4px)'});
    c.addEventListener('mouseleave',function(){c.style.transform=''});
  });
}

/* ---------- Background: drifting "photon" particles ---------- */
var cv=$('#bg'),cx=cv.getContext('2d'),pts=[],W,H,raf;
function initBg(){
  W=cv.width=innerWidth;H=cv.height=innerHeight;
  var n=Math.min(70,Math.floor(W*H/22000));pts=[];
  for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.6+.6});
  cancelAnimationFrame(raf);if(reduce){draw();return}loop();
}
function col(){return document.documentElement.getAttribute('data-theme')==='light'?'79,70,229':'34,211,238'}
function draw(){
  cx.clearRect(0,0,W,H);var c=col();
  for(var i=0;i<pts.length;i++){var p=pts[i];
    cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fillStyle='rgba('+c+',.7)';cx.fill();
    for(var j=i+1;j<pts.length;j++){var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
      if(d<16000){cx.strokeStyle='rgba('+c+','+(.16*(1-d/16000))+')';cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(q.x,q.y);cx.stroke()}}}
}
function loop(){
  pts.forEach(function(p){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1});
  draw();raf=requestAnimationFrame(loop);
}
var rs;addEventListener('resize',function(){clearTimeout(rs);rs=setTimeout(initBg,200)});

/* ---------- Stagger delays ---------- */
$$('.hero-text > .reveal').forEach(function(e,i){e.style.transitionDelay=(i*0.09)+'s'});
$('.hero-visual').style.transitionDelay='.25s';
['.cards3','.skills-grid','.stats','.edu-grid','.certs','.about-grid','.timeline'].forEach(function(sel){
  var c=$(sel);if(!c)return;$$(':scope > .reveal',c).forEach(function(e,i){e.style.transitionDelay=(i*0.11)+'s'});
});

/* ---------- Pointer effects ---------- */
if(!reduce&&matchMedia('(pointer:fine)').matches){
  document.addEventListener('mousemove',function(e){
    var t=e.target.closest&&e.target.closest('.card,.pub,.stat');
    if(t){var r=t.getBoundingClientRect();t.style.setProperty('--mx',(e.clientX-r.left)+'px');t.style.setProperty('--my',(e.clientY-r.top)+'px')}
  },{passive:true});
  $$('.btn').forEach(function(b){
    b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.28)+'px)'});
    b.addEventListener('mouseleave',function(){b.style.transform=''});
  });
  var hv=$('.hero-visual'),st=$('#stage');
  hv.addEventListener('mousemove',function(e){
    var r=hv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    st.style.setProperty('--ry',(x*10)+'deg');st.style.setProperty('--rx',(-y*8)+'deg');
    st.style.setProperty('--px',(x*-14)+'px');st.style.setProperty('--py',(y*-8)+'px');
  });
  hv.addEventListener('mouseleave',function(){['--ry','--rx','--px','--py'].forEach(function(k){st.style.removeProperty(k)})});
}

/* ---------- Timeline draws as you scroll ---------- */
var tl=$('.timeline');
function drawTL(){if(!tl||reduce)return;var r=tl.getBoundingClientRect(),f=(innerHeight*.75-r.top)/r.height;tl.style.setProperty('--tl',Math.max(.04,Math.min(1,f)))}
addEventListener('scroll',drawTL,{passive:true});drawTL();

/* ---------- Copy email ---------- */
var tt;
$('#copy').addEventListener('click',function(){
  var m='saifsaifulislam765@gmail.com',done=function(){var t=$('#toast');t.textContent=T[lang].copied;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},2200)};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(m).then(done,function(){location.href='mailto:'+m})}else{location.href='mailto:'+m}
});

/* ---------- Init ---------- */
$('#yr').textContent=new Date().getFullYear();
initBg();
(function(){var l=store.get('lang');setLang(l==='bn'||l==='ar'?l:'en')})();
observe();
})();
