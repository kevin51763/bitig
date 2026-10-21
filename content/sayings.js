/* 名句：首页轮流显示，“全部名句”页按语言列出。
   同一个浏览器里，每一句都出现过一遍才会重新轮起。

   每一句写成一行 { … }，末尾留一个逗号。可以写：
     lang  语言简写（config/languages.js 里的 id）
     tr    转写（读音）。回鹘文、如尼文写这一项，原文和换写自动生成
     tl    拉丁转写。满文、蒙古文、藏文写这一项，原文自动生成
     sc    原文。察合台文，以及没有转换规则的语言，直接写原文；这时 tr 可作读音
     zh    汉译。有汉文原典的（如《论语》），直接写原文
     src   出处
   不想再显示某一句，删掉那一行，或在行首加 // 。 */
SIYI.sayings = [
  /* ---- 突厥如尼文：tr 用 Tekin 1968 的转写 ---- */
  { lang: 'rn', tr: 'üzä kök täŋri asra yaγïz yer qïlïntuqda ekin ara kiši oγlï qïlïnmïš', zh: '上面的蓝天、下面的褐色大地造成之时，人类在二者之间被造了出来。', src: '阙特勤碑东面第 1 行' },
  { lang: 'rn', tr: 'öd täŋri yasar, kiši oγlï qop ölgäli törümiš', zh: '时运由上天安排，人类生来都要死去。', src: '阙特勤碑北面第 10 行' },
  { lang: 'rn', tr: 'yuyqa ärkli topulγalï učuz ärmiš, yinčgä ärklig üzgäli učuz; yuyqa qalïn bolsar topulγuluq alp ärmiš, yinčgä yoγun bolsar üzgülük alp ärmiš', zh: '薄的容易刺穿，细的容易折断；薄的变厚了，就难以刺穿，细的变粗了，就难以折断。', src: '暾欲谷碑第 13–14 行' },
  { lang: 'rn', tr: 'üzä täŋri basmasar, asra yer tälinmäsär, türk bodun, eliŋin törüŋin kim artatï udačï ärti', zh: '只要上面的天不塌，下面的地不裂，突厥人民啊，谁能毁掉你的国家和法度？', src: '阙特勤碑东面第 22 行' },
  { lang: 'rn', tr: 'türk bodun, ačsar tosïq ömäz sän, bir todsar ačsïq ömäz sän', zh: '突厥人民啊，你饥饿时想不到饱足，一旦吃饱了，又想不到饥饿。', src: '阙特勤碑南面第 8 行' },
  { lang: 'rn', tr: 'ïraq ärsär yablaq aγï birür, yaγuq ärsär ädgü aγï birür', zh: '（他们说：）住得远，就给坏的财物；住得近，就给好的财物。', src: '阙特勤碑南面第 7 行' },
  { lang: 'rn', tr: 'qanïŋ subča yügürti, süŋüküŋ taγča yatdï', zh: '你的血像水一样流淌，你的骨头像山一样堆积。', src: '阙特勤碑东面第 24 行' },
  { lang: 'rn', tr: 'bilgä qaγan ärmiš, alp qaγan ärmiš; buyruqï yemä bilgä ärmiš ärinč, alp ärmiš ärinč', zh: '他们是贤明的可汗、勇武的可汗；他们的大臣想必也是贤明的、勇武的。', src: '阙特勤碑东面第 3–4 行' },
  { lang: 'rn', tr: 'türk bodun üčün tün udïmadïm, küntüz olurmadïm', zh: '为了突厥人民，我夜里不曾睡，白天不曾坐。', src: '阙特勤碑东面第 27 行' },
  { lang: 'rn', tr: 'täŋri yarlïqaduq üčün, özüm qutum bar üčün qaγan olurtum', zh: '因为上天保佑，因为我自己有福分，我登上了汗位。', src: '阙特勤碑南面第 9 行' },
  { lang: 'rn', tr: 'tabγač, oγuz, qïtań, bu üčägü qabsar, qaltačï biz', zh: '唐人、乌古斯、契丹，这三者若是联合起来，我们就完了。', src: '暾欲谷碑第 12 行' },
  { lang: 'rn', tr: 'qaγanï alp ärmiš, ayγučïsï bilgä ärmiš', zh: '他们的可汗勇武，谋臣贤明。', src: '暾欲谷碑' },

  /* ---- 回鹘文：tr 写转写，原文用回鹘字母生成 ---- */
  { lang: 'ug', tr: 'bayat atï birlä sözüg bašladïm, törütgän igidgän kečürgän idim', zh: '我以真主之名开始言说，他是创造者、养育者、宽恕者。', src: '《福乐智慧》第 1 联' },
  { lang: 'ug', tr: 'til arslan turur, kör, ešiktä yatur, ay ävlüg ärä, saqla, bašïŋ yeyür', zh: '舌头是一头狮子，就卧在门槛上；当家的人啊，小心，它会吞掉你的头。', src: '《福乐智慧》论言语一章' },
  { lang: 'ug', tr: 'uquš körki til ol, tilin körki söz, kiši körki yüz ol, yüzin körki köz', zh: '智慧的光彩在舌头，舌头的光彩在言辞；人的光彩在面容，面容的光彩在眼睛。', src: '《福乐智慧》论言语一章' },
  { lang: 'ug', tr: 'uquš qayda ärsä uluγluq anuq, bilig kimdä ärsä bädüklük anuq', zh: '哪里有智慧，哪里就有伟大；谁有知识，谁就有尊荣。', src: '《福乐智慧》' },
  { lang: 'ug', tr: 'kiši alasï ičtin, yïlqï alasï taštïn', zh: '人的花斑在里面，牲畜的花斑在外面。', src: '《突厥语大词典》谚语（原书为阿拉伯字母，此处以回鹘字母写出）' },
  { lang: 'ug', tr: 'taγ taγqa qawušmas, kiši kišikä qawušur', zh: '山与山不相逢，人与人总相逢。', src: '《突厥语大词典》谚语（原书为阿拉伯字母，此处以回鹘字母写出）' },
  { lang: 'ug', tr: 'ot tütünsüz bolmas, yigit yazuqsuz bolmas', zh: '没有不冒烟的火，没有不犯错的少年。', src: '《突厥语大词典》谚语（原书为阿拉伯字母，此处以回鹘字母写出）' },

  /* ---- 满文：tl 写穆麟德夫转写 ---- */
  { lang: 'mnc', tl: 'tacimbime erindari urebuci, inu urgun akū semeo', zh: '学而时习之，不亦说乎？', src: '满文《论语·学而》' },
  { lang: 'mnc', tl: 'gucu goro baci jici, inu sebjen akū semeo', zh: '有朋自远方来，不亦乐乎？', src: '满文《论语·学而》' },
  { lang: 'mnc', tl: 'niyalma sarkū bime korsorakū oci, inu ambasa saisa wakao', zh: '人不知而不愠，不亦君子乎？', src: '满文《论语·学而》' },
  { lang: 'mnc', tl: 'sara be sambi sembi, sarkū be sarkū sembi, ere uthai sarangge kai', zh: '知之为知之，不知为不知，是知也。', src: '满文《论语·为政》' },
  { lang: 'mnc', tl: 'ilan niyalma yabuci, urunakū mini sefu bi', zh: '三人行，必有我师焉。', src: '满文《论语·述而》' },
  { lang: 'mnc', tl: 'amba tacin i doro, genggiyen erdemu be genggiyelere de, irgen be icemlere de, umesi sain de ilinara de bi', zh: '大学之道，在明明德，在亲民，在止于至善。', src: '满文《大学》首章' },
  { lang: 'mnc', tl: 'abkai hese be banin sembi, banin be dahara be doro sembi, doro be dasara be tacihiyan sembi', zh: '天命之谓性，率性之谓道，修道之谓教。', src: '满文《中庸》首章' },
  { lang: 'mnc', tl: 'abkai erin, na i aisi de isirakū, na i aisi, niyalmai hūwaliyasun de isirakū', zh: '天时不如地利，地利不如人和。', src: '满文《孟子·公孙丑下》' },
  { lang: 'mnc', tl: 'jui i jui, omolo i omolo, mohon wajin akū kai. alin oci nemerakū, aide terei necihiyeme muterakū de sengguwembi', zh: '子子孙孙无穷匮也，而山不加增，何苦而不平？', src: '《列子·汤问》愚公移山，满文本（见范文）' },

  /* ---- 蒙古文：tl 写学术转写，分写的 a、e 记作 -a、-e ---- */
  { lang: 'mn', tl: 'činggis qaγan-u uγ iǰaγur degere tngri-eče ǰayaγatu töregsen börte čino-a aǰuγu', zh: '当初元朝的人祖，是天生一个苍色的狼。', src: '《蒙古秘史》第 1 节（汉译取明代总译）' },
  { lang: 'mn', tl: 'möngke tngri-yin küčün-dür yeke mongγol ulus-un dalai-yin qan-u ǰarliγ il bulγa irgen-dür kürbesü büsiregtügei ayutuγai', zh: '长生天气力里，大蒙古国海内之汗的圣旨，到达归附的和叛离的百姓那里，都当敬奉，都当畏惧。', src: '贵由汗印文（1246）' },
  { lang: 'mn', tl: 'keüked-ün keüked, ači-yin ači, qoisi ür-e ündüsü tasurasi ügei bolai. aγula bolbasu öskü ügei', zh: '子子孙孙无穷匮也，而山不加增。', src: '《列子·汤问》愚公移山，蒙古文本（见范文）' },
  { lang: 'mn', tl: 'ebtei šaγaǰaγai buγu barin-a', zh: '齐心的喜鹊能捉住鹿。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'γaγča modu γal bolqu ügei, γaγča kümün ayil bolqu ügei', zh: '一根木头烧不成火，一个人成不了一户人家。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'kümün bolqu baγ-a-ača, külüg bolqu unaγan-ača', zh: '成器的人，从小看得出；成骏马的，从驹子看得出。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'kümün törögsen γaǰar-taγan, noqai čaduγsan γaǰar-taγan', zh: '人恋生身之地，狗恋吃饱之处。', src: '蒙古族谚语' },

  /* ---- 藏文：tl 写威利转写，/ 是垂符 ---- */
  { lang: 'bo', tl: 'sdig pa ci yang mi bya zhing/ dge ba phun sum tshogs par spyod/ rang gi sems ni yongs su \'dul/ \'di ni sangs rgyas bstan pa yin/', zh: '诸恶莫作，众善奉行，自净其意，是诸佛教。', src: '七佛通诫偈，藏译' },
  { lang: 'bo', tl: 'gzugs stong pa\'o/ stong pa nyid gzugs so/ gzugs las stong pa nyid gzhan ma yin/ stong pa nyid las kyang gzugs gzhan ma yin no/', zh: '色即是空，空即是色；空不异色，色不异空。', src: '《般若波罗蜜多心经》藏译（汉文取玄奘译本字句，次序依藏文）' },
  { lang: 'bo', tl: 'chos rnams thams cad rgyu las byung/ de rgyu de bzhin gshegs pas gsungs/ rgyu la \'gog pa gang yin pa/ dge sbyong chen pos \'di skad gsungs/', zh: '诸法从缘起，如来说是因；彼法因缘尽，是大沙门说。', src: '缘起偈，藏译' },
  { lang: 'bo', tl: 'sangs rgyas chos dang tshogs kyi mchog rnams la/ byang chub bar du bdag ni skyabs su mchi/', zh: '诸佛正法贤圣僧，直至菩提我皈依。', src: '阿底峡《皈依发心偈》' },
  { lang: 'bo', tl: 'byang chub sems mchog rin po che/ ma skyes pa rnams skye gyur cig/ skyes pa nyams pa med pa dang/ gong nas gong du \'phel bar shog/', zh: '菩提心妙宝，未生者令生，已生者不退，辗转益增上。', src: '发菩提心愿文' },
  { lang: 'bo', tl: 'ji srid nam mkha\' gnas pa dang/ \'gro ba ji srid gnas gyur pa/ de srid bdag ni gnas gyur nas/ \'gro ba\'i sdug bsngal sel bar shog/', zh: '乃至有虚空，以及众生住，愿吾住世间，尽除众生苦。', src: '寂天《入菩萨行论》第十品' },
  { lang: 'bo', tl: 'chu thigs bsags na rgya mtsho chags/', zh: '水滴积聚起来，便成大海。', src: '藏族谚语' },

  /* ---- 察合台文：sc 写原文，tr 写读音 ---- */
  { lang: 'chg', sc: 'هر کیم که وفا قیلسه وفا تاپقوسیدور / هر کیم که جفا قیلسه جفا تاپقوسیدور', tr: 'har kim ki wafā qïlsa wafā tapqusïdur / har kim ki ǰafā qïlsa ǰafā tapqusïdur', zh: '谁守信义，终将得到信义；谁行残暴，终将遭到残暴。', src: '巴布尔四行诗，前两行' },
  { lang: 'chg', sc: 'یخشی کیشی کورمگای یمانلیق هرگز / هر کیم که یمان بولسه جزا تاپقوسیدور', tr: 'yaxšï kiši körmägäy yamanlïq hargiz / har kim ki yaman bolsa ǰazā tapqusïdur', zh: '好人决不会遭到恶报；谁作恶，谁就会受到惩罚。', src: '巴布尔四行诗，后两行' },
  { lang: 'chg', sc: 'آدمی ارسنگ دیمه گیل آدمی / آنی کیم یوق خلق غمیدین غمی', tr: 'ādamī ersäŋ demägil ādamī / anï kim yoq xalq γamïdïn γamï', zh: '你若是人，就别把不为众人的忧愁而忧愁的人叫作人。', src: '纳瓦依诗句' },
  { lang: 'chg', sc: 'قرا کوزوم کیلو مردملیغ امدی فن قیلغیل', tr: 'qara közüm, kelü mardumlïγ emdi fan qïlγïl', zh: '我的黑眼睛啊，来吧，从此把仁爱当作你的本事。', src: '纳瓦依加泽勒首句' },
  { lang: 'chg', sc: 'تیلگه اختیارسیز ایلگه اعتبارسیز', tr: 'tilgä ixtiyārsïz, elgä iʿtibārsïz', zh: '管不住舌头的人，在众人面前也没有分量。', src: '纳瓦依《心之所爱》' },
];
