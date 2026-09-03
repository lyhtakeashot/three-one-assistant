export const SCHOOLS = [
{
  id:'zju', name:'浙江大学', shortName:'浙大', aliases:['浙大','ZJU'], type:'ministry',
  info:{ campuses:[{name:'紫金港校区',address:'杭州市西湖区余杭塘路866号'},{name:'玉泉校区',address:'杭州市西湖区浙大路38号'}], website:'https://www.zju.edu.cn', admissionsPhone:'0571-87951006', tuitionGeneral:'5300-6000元/年', healthRestrictions:'参照《普通高等学校招生体检工作指导意见》执行，色盲色弱考生部分专业受限' },
  formula:{ xuekao:{A:10,B:9,C:8,D:6,fullScore:100}, xiaokao:{fullScore:100}, gaokao:{fullScore:750}, weights:{xuekao:0.15,xiaokao:0.25,gaokao:0.60} },
  examFormat:{ hasWrittenTest:true, hasInterview:true, hasPhysicalTest:false, writtenTestSubjects:['数学','物理'], interviewFormat:'group', contentSummary:'笔试考查数学和物理基础，面试为无领导小组讨论形式，重点考察逻辑思维、表达能力和综合素质。', tips:'浙大三一面向全省招生名额多，学考要求相对宽松（D等也有6分），适合学考非全A但高考实力强的考生。' },
  transferRestriction:{ restricted:true, detail:'三位一体录取学生可按学校规定申请转专业，但须满足拟转入专业前置课程等要求，具体以学校当年转专业实施办法为准。' },
  majors:[{id:'zju-m1',schoolId:'zju',name:'计算机科学与技术',category:'工学',requiredSubjects:['物理'],planCount:15},{id:'zju-m2',schoolId:'zju',name:'人工智能',category:'工学',requiredSubjects:['物理'],planCount:10},{id:'zju-m3',schoolId:'zju',name:'临床医学',category:'医学',requiredSubjects:['物理','化学'],planCount:20},{id:'zju-m4',schoolId:'zju',name:'法学',category:'法学',requiredSubjects:[],planCount:8}],
  admission:[{year:2025,applicants:18000,passed:4800,admitted:980,minScore:86,xuekaoRequirement:'各科目均须合格'},{year:2024,applicants:16500,passed:4500,admitted:950,minScore:85,xuekaoRequirement:'各科目均须合格'}],
  satisfaction:{overall:4.7,environment:4.6,life:4.3,source:'阳光高考网'},
  dormitory:{ description:'紫金港校区为4人间，独立卫浴、空调、热水器齐全，有阳台。', score:4.5, source:'网络整理', highlights:['4人间','独立卫浴','空调热水器','有阳台'], drawbacks:['部分老宿舍楼条件一般'] },
  applicationSteps:[{step:1,title:'网上报名',description:'登录浙江大学本科生招生网进行在线报名',deadline:'5月中旬',materials:['身份证','学考成绩证明','个人陈述']},{step:2,title:'材料审核',description:'学校对报名材料进行审核，公布初审通过名单',deadline:'5月下旬'},{step:3,title:'综合素质测试',description:'参加浙大组织的笔试和面试',deadline:'6月中旬'},{step:4,title:'填报志愿',description:'在高考提前批填写三位一体志愿',deadline:'6月下旬'}]
},
{
  id:'hdu', name:'杭州电子科技大学', shortName:'杭电', aliases:['杭电','HDU'], type:'provincial',
  info:{ campuses:[{name:'下沙校区',address:'杭州市钱塘区白杨街道2号大街1158号'}], website:'https://www.hdu.edu.cn', admissionsPhone:'0571-86915007', tuitionGeneral:'5300-6000元/年', tuitionSinoForeign:'25000-35000元/年（中外合作办学项目）' },
  formula:{ xuekao:{A:15,B:10,C:6,D:1,fullScore:150}, xiaokao:{fullScore:100}, gaokao:{fullScore:750}, weights:{xuekao:0.15,xiaokao:0.25,gaokao:0.60} },
  examFormat:{ hasWrittenTest:true, hasInterview:true, hasPhysicalTest:false, writtenTestSubjects:['数学','英语','逻辑'], interviewFormat:'individual', contentSummary:'笔试含数学基础、英语阅读和逻辑推理。面试为个体面试，每人15-20分钟。', tips:'杭电笔试难度适中，面试重视对信息类专业的了解和兴趣。' },
  transferRestriction:{ restricted:false, detail:'三位一体录取学生入学后可按学校规定申请转专业，与普通高考录取学生享有同等权利。' },
  majors:[{id:'hdu-m1',schoolId:'hdu',name:'计算机类',category:'工学',requiredSubjects:['物理'],planCount:30},{id:'hdu-m2',schoolId:'hdu',name:'电子信息类',category:'工学',requiredSubjects:['物理'],planCount:35},{id:'hdu-m3',schoolId:'hdu',name:'自动化',category:'工学',requiredSubjects:['物理'],planCount:20},{id:'hdu-m4',schoolId:'hdu',name:'会计学',category:'管理学',requiredSubjects:[],planCount:15}],
  admission:[{year:2025,applicants:12000,passed:3200,admitted:450,minScore:78,xuekaoRequirement:'学考≥6A或折算分≥90分'},{year:2024,applicants:11000,passed:3000,admitted:430,minScore:76,xuekaoRequirement:'学考≥6A或折算分≥90分'}],
  satisfaction:{overall:4.3,environment:4.1,life:4.0,source:'阳光高考网'},
  dormitory:{ description:'下沙校区为4-6人间，有独立卫浴和空调。生活区配套完善，食堂性价比高。', score:4.0, source:'网络整理', highlights:['独立卫浴','空调','食堂实惠'], drawbacks:['6人间稍显拥挤','老宿舍装修一般'] },
  applicationSteps:[{step:1,title:'网上报名',description:'登录杭电本科招生网报名',deadline:'3月中旬',materials:['身份证','1寸照片','学考成绩单']},{step:2,title:'资格审查',description:'公布初审结果',deadline:'4月上旬'},{step:3,title:'综合素质测试',description:'参加笔试和面试',deadline:'4月中旬'},{step:4,title:'公布入围名单',description:'公布最终入围名单',deadline:'4月下旬'}]
},
{
  id:'zufe', name:'浙江财经大学', shortName:'浙财', aliases:['浙财','ZUFE','浙江财经'], type:'provincial',
  info:{ campuses:[{name:'下沙校区',address:'杭州市钱塘区学源街18号'}], website:'https://www.zufe.edu.cn', admissionsPhone:'0571-87557480', consultQQ:'800185588', tuitionGeneral:'4800-5500元/年', tuitionSinoForeign:'28000元/年（会计学中外合作）' },
  formula:{ xuekao:{A:15,B:9,C:3,D:0,fullScore:150}, xiaokao:{fullScore:100}, gaokao:{fullScore:750}, weights:{xuekao:0.15,xiaokao:0.25,gaokao:0.60} },
  examFormat:{ hasWrittenTest:false, hasInterview:true, hasPhysicalTest:false, interviewFormat:'group', contentSummary:'无领导小组面试，每组8-10人，围绕经济、社会热点话题进行讨论。', tips:'浙财面试不考专业知识，重点看表达和逻辑。' },
  transferRestriction:{ restricted:false, detail:'三位一体录取学生在校期间可按学校规定申请转专业。' },
  majors:[{id:'zufe-m1',schoolId:'zufe',name:'会计学',category:'管理学',requiredSubjects:[],planCount:20},{id:'zufe-m2',schoolId:'zufe',name:'金融学',category:'经济学',requiredSubjects:[],planCount:25},{id:'zufe-m3',schoolId:'zufe',name:'财政学',category:'经济学',requiredSubjects:[],planCount:15},{id:'zufe-m4',schoolId:'zufe',name:'法学',category:'法学',requiredSubjects:[],planCount:10}],
  admission:[{year:2025,applicants:8500,passed:2200,admitted:300,minScore:72,xuekaoRequirement:'学考≥5A2B或折算分≥80分'},{year:2024,applicants:8000,passed:2000,admitted:280,minScore:70,xuekaoRequirement:'学考≥5A2B或折算分≥80分'}],
  satisfaction:{overall:4.1,environment:4.0,life:3.9,source:'阳光高考网'},
  dormitory:{ description:'4人间为主，独立卫浴、空调、热水器齐全。', score:4.0, source:'网络整理', highlights:['4人间','独立卫浴','空调热水器'], drawbacks:['部分宿舍楼较旧'] },
  applicationSteps:[{step:1,title:'网上报名',description:'登录浙江财经大学招办网站报名',deadline:'3月上中旬',materials:['身份证','1寸照','学考成绩']},{step:2,title:'初审',description:'公布初审结果',deadline:'4月上旬'},{step:3,title:'面试',description:'无领导小组讨论面试',deadline:'4月中旬'},{step:4,title:'公布结果',description:'公布三一入围考生名单',deadline:'4月下旬'}]
},
{
  id:'nbu', name:'宁波大学', shortName:'宁大', aliases:['宁大','NBU','宁波大学'], type:'provincial',
  info:{ campuses:[{name:'本部校区',address:'宁波市江北区风华路818号'},{name:'梅山校区',address:'宁波市北仑区梅山保税港区七星南路169号'}], website:'https://www.nbu.edu.cn', admissionsPhone:'0574-87600233', tuitionGeneral:'4800-6000元/年', healthRestrictions:'航海类专业有特殊体检要求，色盲色弱考生不宜报考' },
  formula:{ xuekao:{A:10,B:8,C:6,D:0,fullScore:100}, xiaokao:{fullScore:100}, gaokao:{fullScore:750}, weights:{xuekao:0.15,xiaokao:0.25,gaokao:0.60} },
  examFormat:{ hasWrittenTest:false, hasInterview:true, hasPhysicalTest:false, interviewFormat:'individual', contentSummary:'个体面试，每人约10-15分钟。包含自我介绍、结构化问答和考官自由提问。', tips:'宁大面试较轻松，氛围友好。建议准备1-2分钟自我介绍。' },
  transferRestriction:{ restricted:true, detail:'三位一体录取学生可在入学后申请转专业，但部分热门专业（如师范类、临床医学）限制转入名额。' },
  majors:[{id:'nbu-m1',schoolId:'nbu',name:'法学',category:'法学',requiredSubjects:[],planCount:15},{id:'nbu-m2',schoolId:'nbu',name:'通信工程',category:'工学',requiredSubjects:['物理'],planCount:20},{id:'nbu-m3',schoolId:'nbu',name:'英语（师范）',category:'文学',requiredSubjects:[],planCount:12},{id:'nbu-m4',schoolId:'nbu',name:'临床医学',category:'医学',requiredSubjects:['化学','生物'],planCount:25}],
  admission:[{year:2025,applicants:9500,passed:2500,admitted:380,minScore:75,xuekaoRequirement:'学考≥5A'},{year:2024,applicants:9000,passed:2400,admitted:360,minScore:73,xuekaoRequirement:'学考≥5A'}],
  satisfaction:{overall:4.3,environment:4.5,life:4.2,source:'阳光高考网'},
  dormitory:{ description:'本部校区4人间为主，独立卫浴、空调、热水器。梅山校区有海景宿舍。', score:4.3, source:'网络整理', highlights:['4人间','独立卫浴','海景宿舍','商业街'], drawbacks:['本部部分老宿舍需改造'] },
  applicationSteps:[{step:1,title:'网上报名',description:'登录宁波大学本科招生网报名',deadline:'3月中旬',materials:['身份证','照片','学考成绩']},{step:2,title:'初审公示',description:'公布通过初审考生名单',deadline:'4月上旬'},{step:3,title:'综合素质测试',description:'个体面试',deadline:'4月中下旬'},{step:4,title:'入围公示',description:'公示三一招生入围考生',deadline:'5月上旬'}]
},
{
  id:'wzu', name:'温州大学', shortName:'温大', aliases:['温大','WZU','温州大学'], type:'provincial',
  info:{ campuses:[{name:'茶山校区',address:'温州市瓯海区茶山高教园区'}], website:'https://www.wzu.edu.cn', admissionsPhone:'0577-86680800', tuitionGeneral:'4800-5500元/年' },
  formula:{ xuekao:{A:15,B:10,C:5,D:0,fullScore:150}, xiaokao:{fullScore:100}, gaokao:{fullScore:750}, weights:{xuekao:0.15,xiaokao:0.25,gaokao:0.60} },
  examFormat:{ hasWrittenTest:false, hasInterview:true, hasPhysicalTest:false, interviewFormat:'both', contentSummary:'面试形式含个体面和群面。个体面侧重自我介绍和专业认知；群面为无领导小组讨论，话题涉及社会热点。', tips:'温大面试较灵活，建议同时准备个体面和群面。' },
  transferRestriction:{ restricted:false, detail:'三位一体录取学生可按规定参加校内转专业，不受三一资格限制。' },
  majors:[{id:'wzu-m1',schoolId:'wzu',name:'小学教育（师范）',category:'教育学',requiredSubjects:[],planCount:30},{id:'wzu-m2',schoolId:'wzu',name:'生物科学（师范）',category:'理学',requiredSubjects:['生物'],planCount:20},{id:'wzu-m3',schoolId:'wzu',name:'机械工程',category:'工学',requiredSubjects:['物理'],planCount:25},{id:'wzu-m4',schoolId:'wzu',name:'汉语言文学（师范）',category:'文学',requiredSubjects:[],planCount:15}],
  admission:[{year:2025,applicants:7000,passed:1800,admitted:300,minScore:70,xuekaoRequirement:'学考≥4A或折算分≥75分'},{year:2024,applicants:6500,passed:1700,admitted:280,minScore:68,xuekaoRequirement:'学考≥4A或折算分≥75分'}],
  satisfaction:{overall:3.9,environment:4.0,life:3.8,source:'阳光高考网'},
  dormitory:{ description:'4-6人间，有空调和独立卫浴。茶山校区环境优美，依山傍水。', score:3.8, source:'网络整理', highlights:['空调','独立卫浴','校园环境好'], drawbacks:['6人间较拥挤','热水供应偶有问题'] },
  applicationSteps:[{step:1,title:'网上报名',description:'登录温州大学招生网在线报名',deadline:'3月中旬',materials:['身份证','学考成绩单','1寸照']},{step:2,title:'初审',description:'学校审核并公布通过名单',deadline:'4月上旬'},{step:3,title:'面试',description:'个体面试+群面',deadline:'4月中下旬'},{step:4,title:'入围公布',description:'公布三一入围考生名单',deadline:'5月上旬'}]
}];

export const SUBJECTS = ['物理','化学','生物','政治','历史','地理','技术'];
export const FAQ_DATA = [
  {q:'什么是三位一体招生？',a:'三位一体招生是浙江省特有的高考招生模式，将考生的"高中学业水平考试（学考）成绩 + 高校综合素质测试（校测）成绩 + 高考成绩"三个维度按照一定比例折算成综合分进行录取。每位考生在提前批只能填报一所三位一体院校。'},
  {q:'三位一体适合什么样的学生？',a:'适合三类考生：①学考成绩优秀但高考不一定能稳定发挥的学生；②有竞赛或特长在校测面试环节有优势的学生；③目标院校明确希望通过多维度评价增加录取机会的学生。'},
  {q:'什么是"冲稳保"策略？',a:'"冲刺"指往年录取分数线略高于你成绩的院校；"稳妥"指与你成绩匹配度高的院校；"保底"指录取概率很大的院校。但需特别注意：三位一体在提前批录取只能填报一所院校因此需要审慎选择。'},
  {q:'学考等级如何折算成综合分？',a:'各校折算标准不同。例如：部分院校 A=15、B=10、C=6、D=1、E=0（满分150分），也有院校采用 A=10、B=8、C=6 等其他比例。具体以各校招生章程为准。'},
  {q:'校测主要考什么？',a:'校测一般包含笔试和面试。笔试常考学科素养或综合知识；面试形式有个面、群面或两者结合。部分院校还有体能测试或心理测试环节。'},
  {q:'三位一体录取后可以转专业吗？',a:'各校规定不同。部分院校可以转专业（满足条件），部分有限制（如只能在三一招生专业内转），还有部分明确禁止。报考前务必仔细查看目标院校的规定。'},
  {q:'三位一体和普通高考录取有什么区别？',a:'三位一体在提前批录取，如果被录取则不再参加后续普通批次录取；如果未被录取不影响普通批次志愿录取。这就是为什么建议稳妥选择——因为机会只有一次。'},
  {q:'数据来源是否可靠？',a:'本系统数据来源于浙江省教育考试院官网、各高校招生网和阳光高考网。由于招生政策可能调整请以官方最新公告为准。'}
];
