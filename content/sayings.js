/* 名句：首页轮流显示，“全部名句”页按语言列出。
   同一个浏览器里，每一句都出现过一遍才会重新轮起。

   每一句写成一行 { … }，末尾留一个逗号。可以写：
     lang  语言简写（config/languages.js 里的 id）
     tr    转写（读音）。回鹘文、如尼文写这一项，原文和换写自动生成
     tl    拉丁转写。满文、蒙古文、藏文写这一项，原文自动生成
     sc    原文。察合台文，以及没有转换规则的语言，直接写原文；这时 tr 可作读音
     zh    汉译
     src   出处
   不想再显示某一句，删掉那一行，或在行首加 // 。 */
SIYI.sayings = [
  /* ---- 突厥如尼文：tr 用 Tekin 1968 的转写 ---- */
  { lang: 'rn', tr: 'öd täŋri yasar, kiši oγlï qop ölgäli törümiš', zh: '时运由天安排，人生来终有一死。', src: '阙特勤碑北面第 10 行' },
  { lang: 'rn', tr: 'yuyqa ärkli toplaγalï učuz ärmiš, yinčgä ärklig üzgäli učuz', zh: '薄的东西容易压弯，细的东西容易折断。', src: '暾欲谷碑南面' },
  { lang: 'rn', tr: 'üzä täŋri basmasar, asra yer tälinmäsär, türk bodun, eliŋin törüŋin kim artatï udačï ärti', zh: '只要上面的天不塌，下面的地不裂，突厥人民啊，谁能毁坏你的国家和法度？', src: '阙特勤碑东面第 22 行' },
  { lang: 'rn', tr: 'türk bodun, ačsar tosïq ömäz sän, bir todsar ačsïq ömäz sän', zh: '突厥人民啊，你饿时想不到饱，一旦饱了又想不到饿。', src: '阙特勤碑南面第 8 行' },
  { lang: 'rn', tr: 'bu sabïmïn ädgüti äšid, qatïγdï tïŋla', zh: '好好听我这些话，用心听着。', src: '阙特勤碑南面第 2 行' },
  { lang: 'rn', tr: 'qanïŋ subča yügürti, süŋüküŋ taγča yatdï', zh: '你的血像水一样流淌，你的骨头像山一样堆积。', src: '阙特勤碑东面第 24 行' },
  { lang: 'rn', tr: 'täŋri yarlïqaduq üčün, özüm qutum bar üčün qaγan olurtum', zh: '因为上天保佑，因为我自己有福分，我登上了汗位。', src: '阙特勤碑南面第 9 行' },
  { lang: 'rn', tr: 'ïraq ärsär yablaq aγï birür, yaγuq ärsär ädgü aγï birür', zh: '（他们说：）离得远，就给坏的礼物；离得近，就给好的礼物。', src: '阙特勤碑南面第 7 行' },
  { lang: 'rn', tr: 'bäŋgü taš toqïtdïm', zh: '我立下了永久的石碑。', src: '阙特勤碑南面第 11 行' },
  { lang: 'rn', tr: 'qaγanï alp ärmiš, ayγučïsï bilgä ärmiš', zh: '他们的可汗勇武，谋臣贤明。', src: '暾欲谷碑' },

  /* ---- 回鹘文：tr 写转写，原文用回鹘字母生成 ---- */
  { lang: 'ug', tr: 'bayat atï birlä sözüg bašladïm, törütgän igidgän kečürgän idim', zh: '我以真主之名开始言说，祂是创造、养育、宽恕的主。', src: '《福乐智慧》第 1 联' },
  { lang: 'ug', tr: 'til arslan turur, kör, ešiktä yatur, ay ävlüg ärä, saqla, bašïŋ yeyür', zh: '舌头是一头狮子，就卧在门口；当家的人啊，小心，它会吃掉你的头。', src: '《福乐智慧》论言语一章' },
  { lang: 'ug', tr: 'uquš körki til ol, tilin körki söz, kiši körki yüz ol, yüzin körki köz', zh: '智慧的光彩在舌头，舌头的光彩在言辞；人的光彩在面容，面容的光彩在眼睛。', src: '《福乐智慧》论言语一章' },
  { lang: 'ug', tr: 'kiši alasï ičtin, yïlqï alasï taštïn', zh: '人的花斑在里面，牲畜的花斑在外面。', src: '《突厥语大词典》谚语（原书为阿拉伯字母，此处以回鹘字母写出）' },
  { lang: 'ug', tr: 'taγ taγqa qawušmas, kiši kišikä qawušur', zh: '山与山不相逢，人与人总相逢。', src: '《突厥语大词典》谚语（原书为阿拉伯字母，此处以回鹘字母写出）' },
  { lang: 'ug', tr: 'ot tütünsüz bolmas, yigit yazuqsuz bolmas', zh: '没有不冒烟的火，没有不犯错的少年。', src: '《突厥语大词典》谚语（原书为阿拉伯字母，此处以回鹘字母写出）' },
  { lang: 'ug', tr: 'namo but, namo darm, namo saŋ', zh: '南无佛，南无法，南无僧。', src: '回鹘文佛典题记中常见的皈依语' },
  { lang: 'ug', tr: 'altun öŋlüg yaruq yaltrïqlïγ qopda kötrülmiš nom iligi atlïγ nom bitig', zh: '名为“金色光明、闪耀、超出一切的法王”的经书——《金光明最胜王经》的回鹘文题名。', src: '回鹘文《金光明经》' },

  /* ---- 满文：tl 写穆麟德夫转写 ---- */
  { lang: 'mnc', tl: 'mini beye udu bucecibe, jui geli omolo be banjimbi, omolo geli jui be banjimbi', zh: '我即使死了，儿子又生孙子，孙子又生儿子。', src: '《愚公移山》满文本' },
  { lang: 'mnc', tl: 'alin oci nemerakū', zh: '山却不会再增高。', src: '《愚公移山》满文本' },
  { lang: 'mnc', tl: 'tacimbime erindari urebuci, inu urgun akū semeo', zh: '学了又时时温习，不也高兴吗？', src: '满文《论语·学而》' },
  { lang: 'mnc', tl: 'gucu goro baci jici, inu sebjen akū semeo', zh: '有朋友从远方来，不也快乐吗？', src: '满文《论语·学而》' },
  { lang: 'mnc', tl: 'sara be sambi sembi, sarkū be sarkū sembi, ere uthai sarangge kai', zh: '知道就说知道，不知道就说不知道，这才是知。', src: '满文《论语·为政》' },
  { lang: 'mnc', tl: 'ilan niyalma yabuci, urunakū mini sefu bi', zh: '三人同行，其中必定有我的老师。', src: '满文《论语·述而》' },
  { lang: 'mnc', tl: 'abkai hese be banin sembi, banin be dahara be doro sembi, doro be dasara be tacihiyan sembi', zh: '天所赋予的叫作性，顺着性去做叫作道，修明道叫作教。', src: '满文《中庸》首章' },
  { lang: 'mnc', tl: 'amba tacin i doro, genggiyen erdemu be genggiyelere de, irgen be icemlere de, umesi sain de ilinara de bi', zh: '大学的道理，在于彰明光明的德性，在于使人民革新，在于达到至善。', src: '满文《大学》首章' },
  { lang: 'mnc', tl: 'abkai erin, na i aisi de isirakū, na i aisi, niyalmai hūwaliyasun de isirakū', zh: '天时不如地利，地利不如人和。', src: '满文《孟子·公孙丑下》' },

  /* ---- 蒙古文：tl 写学术转写，分写的 a、e 记作 -a、-e ---- */
  { lang: 'mn', tl: 'aγula bolbasu öskü ügei', zh: '山却不会再增高。', src: '《愚公移山》蒙古文本' },
  { lang: 'mn', tl: 'činggis qaγan-u uγ iǰaγur degere tngri-eče ǰayaγatu töregsen börte činu-a aǰuγu', zh: '成吉思汗的根源，是奉上天之命而生的苍狼。', src: '《蒙古秘史》第 1 节' },
  { lang: 'mn', tl: 'möngke tngri-yin küčün-dür', zh: '凭长生天的气力。', src: '贵由汗印（1246）及元代蒙古文圣旨的开头语' },
  { lang: 'mn', tl: 'ebtei šaγaǰaγai buγu barin-a', zh: '齐心的喜鹊能捉住鹿。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'γaγča modu γal bolqu ügei, γaγča kümün ayil bolqu ügei', zh: '一根木头烧不成火，一个人成不了一户人家。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'kümün bolqu baγ-a-ača, külüg bolqu unaγan-ača', zh: '成器的人，从小看得出；成骏马的，从驹子看得出。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'arban quruγu adali ügei', zh: '十个指头不一般长。', src: '蒙古族谚语' },
  { lang: 'mn', tl: 'kümün törögsen γaǰar-taγan, noqai čaduγsan γaǰar-taγan', zh: '人恋生身之地，狗恋吃饱之处。', src: '蒙古族谚语' },

  /* ---- 藏文：tl 写威利转写，/ 是垂符 ---- */
  { lang: 'bo', tl: 'chu thigs bsags na rgya mtsho chags/', zh: '水滴积聚起来，便成大海。', src: '藏族谚语' },
  { lang: 'bo', tl: 'sangs rgyas chos dang tshogs kyi mchog rnams la/ byang chub bar du bdag ni skyabs su mchi/', zh: '佛、法、僧三宝至尊前，直至菩提我皈依。', src: '皈依发心偈' },
  { lang: 'bo', tl: 'sdig pa ci yang mi bya zhing/ dge ba phun sum tshogs par spyod/ rang gi sems ni yongs su \'dul/ \'di ni sangs rgyas bstan pa yin/', zh: '诸恶莫作，众善奉行，自净其意，是诸佛教。', src: '七佛通诫偈，藏译' },
  { lang: 'bo', tl: 'gzugs stong pa\'o/ stong pa nyid gzugs so/ gzugs las stong pa nyid gzhan ma yin/ stong pa nyid las kyang gzugs gzhan ma yin no/', zh: '色是空，空性是色；空性不异于色，色也不异于空性。', src: '《般若波罗蜜多心经》藏译' },
  { lang: 'bo', tl: 'chos rnams thams cad rgyu las byung/ de rgyu de bzhin gshegs pas gsungs/ rgyu la \'gog pa gang yin pa/ dge sbyong chen pos \'di skad gsungs/', zh: '诸法从因生，如来说其因；因灭亦如是，大沙门所说。', src: '缘起偈，藏译' },
  { lang: 'bo', tl: 'ji srid nam mkha\' gnas pa dang/ \'gro ba ji srid gnas gyur pa/ de srid bdag ni gnas gyur nas/ \'gro ba\'i sdug bsngal sel bar shog/', zh: '虚空存在多久，众生存在多久，愿我也住世多久，消除众生的苦。', src: '寂天《入菩萨行论》第十品' },

  /* ---- 察合台文：sc 写原文，tr 写读音 ---- */
  { lang: 'chg', sc: 'هر کیم که وفا قیلسه وفا تاپقوسیدور', tr: 'har kim ki wafā qïlsa wafā tapqusïdur', zh: '谁守信义，终将得到信义。', src: '巴布尔四行诗' },
  { lang: 'chg', sc: 'هر کیم که جفا قیلسه جفا تاپقوسیدور', tr: 'har kim ki ǰafā qïlsa ǰafā tapqusïdur', zh: '谁行残暴，终将遭到残暴。', src: '巴布尔四行诗' },
  { lang: 'chg', sc: 'آدمی ارسنگ دیمه گیل آدمی آنی کیم یوق خلق غمیدین غمی', tr: 'ādamī ersäŋ demägil ādamī, anï kim yoq xalq γamïdïn γamï', zh: '你若是人，就别把不为众人的忧愁而忧愁的人叫作人。', src: '纳瓦依诗句' },
  { lang: 'chg', sc: 'قرا کوزوم کیلو مردملیغ امدی فن قیلغیل', tr: 'qara közüm, kelü mardumlïγ emdi fan qïlγïl', zh: '我的黑眼睛啊，来吧，从此把仁爱当作你的本事。', src: '纳瓦依加泽勒首句' },
  { lang: 'chg', sc: 'تیلگه اختیارسیز ایلگه اعتبارسیز', tr: 'tilgä ixtiyārsïz, elgä iʿtibārsïz', zh: '管不住舌头的人，在众人面前也没有分量。', src: '纳瓦依《心之所爱》' },
];
