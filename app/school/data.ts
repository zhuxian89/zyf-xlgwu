export interface MathProblem {
    id: string;
    question: string;
    answer: number;
    type: 'add' | 'sub' | 'mul' | 'div' | 'word';
    difficulty: 'easy' | 'medium';
}

export interface PinyinProblem {
    id: string;
    word: string;           // 汉字
    correctPinyin: string;  // 正确拼音
    options: string[];      // 选项（包含正确答案和干扰项）
    type: 'select';         // 题目类型
}

export interface SentenceProblem {
    id: string;
    example: string;        // 例句
    pattern: string;        // 句式说明
    correctAnswer: string;  // 正确答案
    options: string[];      // 选项（包含正确答案和干扰项）
}

export interface Chapter {
    id: string;
    title: string;
    content: string;
    reward: number;
}

export interface Book {
    id: string;
    title: string;
    cover?: string;
    chapters: Chapter[];
}

export const BOOKS: Book[] = [
    {
        id: "b1",
        title: "神奇树屋：恐龙谷历险记",
        chapters: [
            {
                id: "c1",
                title: "第一章：走进树林",
                content: `"救命啊！有妖怪！"安妮喊叫着。
        "是啊，没错。"杰克说，"还真是一个大妖怪。"
        他把金牌塞进牛仔裤的口袋里。接着他听到了安妮的尖叫声。
        "安妮？"
        杰克还听到了另一种声音：一种沉沉的吼声，像低音大喇叭的声音。
        "杰克！快上这儿来！"安妮叫着。
        "安妮！"
        "嗨！"安妮大喊。
        "嘘！"杰克说，"我们是这儿的不速之客。"
        "但是这儿是哪儿？"安妮问。
        "我不知道。"杰克说。
        "嗨！"安妮又对着那动物大叫起来。
        无齿翼龙抬头看着他们。
        "这儿是哪儿？"安妮朝下面发问。
        "你这个傻帽！它不会说话。"杰克说，"不过那本书可能会告诉我们什么。"
        杰克低下头看那本书。他看到那幅画下面的文字：
        "喂！这儿有一本书给你。"安妮说。她举起一本恐龙的书。蓝色的丝绸书签从书页里露出头来。
        "让我看看，让我看看！"杰克放下他的背包，从安妮手中夺过那本书。
        "你就看看这本，我要看看封面有城堡的那本。"安妮说。
        "不行，我们还是别乱翻了。"杰克说，"我们还不知道这些书的主人是谁呢。"
        尽管他嘴上这么说着，还是忍不住把恐龙书翻到插有书签的那一页。他实在是控制不住自己。
        这种会飞的爬行动物生活在白垩纪。它消失于6500万年前。
        不！不可能！他们不可能来到6500万年前。`,
                reward: 50
            },
            {
                id: "c2",
                title: "第二章：无齿翼龙",
                content: `杰克看着窗外。那只无齿翼龙正站在风中。它有着巨大的翅膀，像蝙蝠一样。它的皮肤看起来很粗糙，像干枯的树皮。
        "它看起来像个滑翔机。"杰克轻声说。
        "它看起来很友好。"安妮说。
        "友好？"杰克问，"你确定吗？"
        "当然。"安妮说，"看，它在朝我们笑呢。"
        杰克仔细看了看。那只无齿翼龙确实张着嘴，但这并不意味着它在笑。也许它只是在打哈欠，或者准备吃掉他们。
        "我们最好小心点。"杰克警告道。
        突然，风开始吹得更猛烈了。树屋开始摇晃。
        "怎么回事？"安妮问。
        "我不知道！"杰克抓住书架，"也许我们要起飞了！"
        树屋旋转起来，越转越快。杰克紧紧闭上眼睛。
        然后，一切都静止了。绝对的静止。
        杰克睁开眼睛。阳光斜射进树屋。
        "我们在哪儿？"安妮问。
        杰克向外看去。窗外的世界完全变了。没有了宾夕法尼亚州的树林，没有了蛙溪镇。
        只有绿色的蕨类植物，高大的橡树，还有……恐龙。`,
                reward: 50
            },
            {
                id: "c3",
                title: "第三章：三角龙",
                content: `"看那边！"安妮指着远处的草地。
        杰克顺着她指的方向看去。在草地上，有一只巨大的动物在吃草。它有三只角，一只在鼻子上，两只在眼睛上方。它的脖子上有一个巨大的骨质盾牌。
        "是三角龙！"杰克兴奋地说，"它是白垩纪晚期的植食性恐龙。"
        他迅速翻开恐龙书，找到了三角龙的图片。书上说，三角龙虽然长得凶猛，但其实很温顺，只吃植物。
        "我们要去看看它吗？"安妮问，眼睛里闪烁着兴奋的光芒。
        "等等，"杰克说，"我们得先观察一下。"
        他拿出笔记本和铅笔，开始记录："三角龙，吃草，温顺。"
        就在这时，三角龙抬起头，看向树屋的方向。它发出一声低沉的吼叫，像是在打招呼，又像是在警告。
        "它看见我们了！"安妮说。
        "别动。"杰克说，"只要我们不威胁它，它应该不会攻击我们。"
        三角龙看了他们一会儿，然后低下头，继续吃草。
        杰克松了一口气。这是他第一次亲眼见到活生生的恐龙。这简直太不可思议了！`,
                reward: 50
            }
        ]
    },
    {
        id: "b2",
        title: "骑摩托车的老鼠",
        chapters: [
            {
                id: "c1",
                title: "第一章：新客人",
                content: `拉尔夫是一只住在山景旅馆215号房间墙洞里的小老鼠。他对这个房间的新客人感到非常好奇。
        这次住进来的客人是一家三口：爸爸、妈妈和一个名叫基思的小男孩。
        拉尔夫最喜欢小孩子了，因为小孩子总是会掉落很多面包屑和饼干渣。
        但是，这次让拉尔夫兴奋的不仅仅是食物。
        当基思打开他的行李箱时，拉尔夫看到了一样让他心跳加速的东西——一辆鲜红色的玩具摩托车！
        它有闪亮的镀铬排气管，黑色的橡胶轮胎，还有一个看起来非常逼真的引擎。
        拉尔夫从来没有见过这么漂亮的摩托车。他梦想着有一天能骑上它，在旅馆的走廊里飞驰。
        "那一定很酷。"拉尔夫自言自语道。
        他看着基思把摩托车放在床头柜上，然后跟着父母去餐厅吃晚饭了。
        房间里空无一人。
        这是拉尔夫的机会！`,
                reward: 50
            },
            {
                id: "c2",
                title: "第二章：摩托车",
                content: `拉尔夫小心翼翼地从墙洞里钻出来。他先是四处张望了一下，确定没有危险，然后飞快地爬上了床头柜。
        那辆红色的摩托车就在眼前，比他在洞里看到的还要漂亮。
        拉尔夫围着摩托车转了一圈，闻了闻橡胶轮胎的味道。那是冒险的味道！
        他试着爬上摩托车。座位对他来说有点高，但他还是费力地爬了上去。
        他的爪子抓住了车把，尾巴自然地垂在后面。
        "噗噗噗——"拉尔夫模仿着摩托车引擎的声音。
        他用力蹬了一下腿，摩托车向前滑行了一点点。
        但是，它并没有像真正的摩托车那样跑起来。
        "怎么回事？"拉尔夫有些失望，"难道它只是个模型？"
        就在这时，电话铃突然响了！
        "叮铃铃——"
        巨大的声音把拉尔夫吓了一大跳。他手一滑，连人带车从床头柜上摔了下去！
        "救命啊！"拉尔夫尖叫着。
        他和摩托车一起掉进了一个金属废纸篓里。`,
                reward: 50
            },
            {
                id: "c3",
                title: "第三章：困境",
                content: `拉尔夫躺在废纸篓的底部，感觉头晕眼花。
        好在废纸篓里有一些废纸，垫了一下，所以他没有受伤。
        但是，那辆漂亮的红色摩托车就没那么幸运了。它侧翻在一旁，前轮还在空转。
        拉尔夫爬起来，检查了一下摩托车。看起来没有坏。
        可是，现在有一个更大的问题：他怎么出去？
        这个废纸篓是金属做的，内壁非常光滑，根本爬不上去。
        拉尔夫试着跳了几次，但废纸篓太高了。
        "这下糟了。"拉尔夫想，"如果清洁工来了，我就要被倒进垃圾车里了！"
        他开始感到害怕。他想念他在墙洞里温暖的家，想念他的妈妈。
        就在这时，房门开了。基思回来了！
        基思走进房间，一眼就看到了床头柜上的摩托车不见了。
        "咦？我的摩托车呢？"基思自言自语道。
        他四处寻找，最后目光落在了废纸篓里。
        拉尔夫屏住了呼吸。`,
                reward: 50
            }
        ]
    },
    {
        id: "b3",
        title: "歪歪小学：奇怪的学校",
        chapters: [
            {
                id: "c1",
                title: "第一章：格芙老师",
                content: `歪歪路小学是一所不小心被建歪了的学校。它本该只有一层高，三十间教室一字排开；可事实上它被建成了三十层高，每层只有一间教室。
        格芙老师是第三十层教室的老师。她有一条长长的舌头和两只尖尖的耳朵。
        她是这所学校里最坏的老师。
        "如果你们这群小屁孩敢调皮捣蛋，"她威胁道，"或者答错问题，我就会动一动耳朵，伸一伸舌头，把你们都变成苹果！"
        格芙老师不喜欢小孩，她只喜欢苹果。
        有一天，乔因为数数数错了，被格芙老师变成了一个红苹果。
        然后，托德因为说话，也被变成了一个苹果。
        很快，教室里堆满了苹果。
        格芙老师看着桌子上的苹果，满意地笑了。
        "现在，我可以好好享用我的午餐了。"她说。
        但是，她没有注意到，有一个学生并没有被变成苹果。那是路易斯，操场上的老师。他正好路过教室门口。`,
                reward: 50
            },
            {
                id: "c2",
                title: "第二章：珠儿老师",
                content: `格芙老师消失了（这是一个很长的故事，总之她最后变成了苹果酱）。
        现在，第三十层的学生们有了一位新老师，她叫珠儿老师。
        珠儿老师非常漂亮，也非常温柔。
        但是，她有一个小问题：她从来没有教过书，也从来没有见过小孩子。
        当她走进教室，看到坐在座位上的学生们时，她惊讶地叫了起来：
        "天哪！这间教室里怎么全是猴子？"
        学生们面面相觑。
        "我们不是猴子，"莫里斯说，"我们是孩子。"
        "别想骗我，"珠儿老师笑着说，"看你们的小耳朵，看你们的小鼻子。你们明明就是可爱的猴子。"
        她拿出一袋香蕉。
        "来，小猴子们，吃香蕉吧。"
        学生们不知道该怎么办。他们确实很喜欢吃香蕉，但他们不想被当成猴子。
        "老师，"卡尔文举起手，"猴子会做数学题吗？"
        "当然不会，"珠儿老师说，"猴子只会爬树。"
        "那如果我们能做对数学题，是不是就证明我们不是猴子？"卡尔文问。`,
                reward: 50
            },
            {
                id: "c3",
                title: "第三章：乔的数数课",
                content: `乔是班上数数最差的学生。
        "乔，你数一数这里有多少本书？"珠儿老师问。
        乔开始数："6，8，12，1，5，2，7，3，4，10。"
        "错了，乔。"珠儿老师说。
        "不，我数对了。"乔说，"你看，我有十根手指，我数到了10，所以这里有10本书。"
        珠儿老师叹了口气："乔，你数到了10，但是你的顺序全乱了。"
        "顺序重要吗？"乔问，"只要最后的结果是对的，不就行了吗？"
        "当然重要。"珠儿老师说，"如果你去商店买东西，你不能给收银员6块钱，然后说这是10块钱。"
        "为什么不行？"乔问，"如果收银员也像我一样数数，那就可以。"
        全班同学都笑了起来。
        乔挠了挠头。他觉得数数真是一件麻烦的事情。
        "好吧，"珠儿老师说，"那我们换一种方法。你把这些书一本一本递给我，每递一本，我就告诉你它是第几本。"
        乔觉得这个主意不错。`,
                reward: 50
            }
        ]
    }
];

// 适合小学2年级的数学题目生成器
export function generateMathProblem(): MathProblem {
    const typeRoll = Math.random();

    if (typeRoll < 0.15) {
        // 20以内加法
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * (20 - a)) + 1;
        return {
            id: `add${Date.now()}`,
            question: `${a} + ${b} = ?`,
            answer: a + b,
            type: 'add',
            difficulty: 'easy'
        };
    } else if (typeRoll < 0.3) {
        // 20以内减法
        const a = Math.floor(Math.random() * 15) + 5;
        const b = Math.floor(Math.random() * a) + 1;
        return {
            id: `sub${Date.now()}`,
            question: `${a} - ${b} = ?`,
            answer: a - b,
            type: 'sub',
            difficulty: 'easy'
        };
    } else if (typeRoll < 0.5) {
        // 乘法表 (1-9)
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        return {
            id: `mul${Date.now()}`,
            question: `${a} × ${b} = ?`,
            answer: a * b,
            type: 'mul',
            difficulty: 'easy'
        };
    } else if (typeRoll < 0.65) {
        // 简单除法
        const b = Math.floor(Math.random() * 9) + 1;
        const ans = Math.floor(Math.random() * 9) + 1;
        const a = b * ans;
        return {
            id: `div${Date.now()}`,
            question: `${a} ÷ ${b} = ?`,
            answer: ans,
            type: 'div',
            difficulty: 'easy'
        };
    } else {
        // 乘除法思维题 (重点加强)
        const templates = [
            // 平均分
            {
                gen: () => {
                    const total = [12, 15, 18, 20, 24, 16, 21, 27, 30][Math.floor(Math.random() * 9)];
                    const people = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
                    const validTotal = Math.floor(total / people) * people;
                    return {
                        q: `${validTotal}个苹果平均分给${people}个小朋友，每人分几个？`,
                        a: validTotal / people
                    };
                }
            },
            // 倍数关系
            {
                gen: () => {
                    const small = Math.floor(Math.random() * 5) + 2;
                    const times = Math.floor(Math.random() * 4) + 2;
                    return {
                        q: `小红有${small}本书，小明的书是小红的${times}倍，小明有几本书？`,
                        a: small * times
                    };
                }
            },
            // 求倍数
            {
                gen: () => {
                    const small = Math.floor(Math.random() * 4) + 2;
                    const times = Math.floor(Math.random() * 4) + 2;
                    const big = small * times;
                    return {
                        q: `小明有${big}颗糖，小红有${small}颗糖，小明的糖是小红的几倍？`,
                        a: times
                    };
                }
            },
            // 每份数量
            {
                gen: () => {
                    const perBox = Math.floor(Math.random() * 6) + 3;
                    const boxes = Math.floor(Math.random() * 5) + 2;
                    return {
                        q: `每盒有${perBox}支铅笔，${boxes}盒一共有多少支？`,
                        a: perBox * boxes
                    };
                }
            },
            // 分组问题
            {
                gen: () => {
                    const perGroup = Math.floor(Math.random() * 4) + 2;
                    const total = perGroup * (Math.floor(Math.random() * 5) + 2);
                    return {
                        q: `${total}个小朋友，每${perGroup}人一组，可以分成几组？`,
                        a: total / perGroup
                    };
                }
            },
            // 行列问题
            {
                gen: () => {
                    const rows = Math.floor(Math.random() * 4) + 2;
                    const cols = Math.floor(Math.random() * 5) + 3;
                    return {
                        q: `教室里的桌子摆成${rows}行，每行${cols}张，一共有多少张桌子？`,
                        a: rows * cols
                    };
                }
            },
            // 买东西（乘法）
            {
                gen: () => {
                    const price = Math.floor(Math.random() * 8) + 2;
                    const count = Math.floor(Math.random() * 6) + 2;
                    return {
                        q: `一本练习本${price}元，买${count}本要多少元？`,
                        a: price * count
                    };
                }
            },
            // 买东西（除法）
            {
                gen: () => {
                    const price = Math.floor(Math.random() * 5) + 2;
                    const count = Math.floor(Math.random() * 5) + 2;
                    const total = price * count;
                    return {
                        q: `${total}元可以买几支${price}元的铅笔？`,
                        a: count
                    };
                }
            },
            // 连乘
            {
                gen: () => {
                    const a = Math.floor(Math.random() * 3) + 2;
                    const b = Math.floor(Math.random() * 3) + 2;
                    const c = Math.floor(Math.random() * 3) + 2;
                    return {
                        q: `${a} × ${b} × ${c} = ?`,
                        a: a * b * c
                    };
                }
            },
            // 乘加混合
            {
                gen: () => {
                    const a = Math.floor(Math.random() * 5) + 2;
                    const b = Math.floor(Math.random() * 5) + 2;
                    const c = Math.floor(Math.random() * 10) + 1;
                    return {
                        q: `${a} × ${b} + ${c} = ?`,
                        a: a * b + c
                    };
                }
            },
            // 乘减混合
            {
                gen: () => {
                    const a = Math.floor(Math.random() * 5) + 2;
                    const b = Math.floor(Math.random() * 5) + 2;
                    const product = a * b;
                    const c = Math.floor(Math.random() * Math.min(product, 10)) + 1;
                    return {
                        q: `${a} × ${b} - ${c} = ?`,
                        a: product - c
                    };
                }
            },
            // 求一个因数
            {
                gen: () => {
                    const a = Math.floor(Math.random() * 7) + 2;
                    const b = Math.floor(Math.random() * 7) + 2;
                    return {
                        q: `? × ${a} = ${a * b}，问号是多少？`,
                        a: b
                    };
                }
            },
            // 分东西
            {
                gen: () => {
                    const each = Math.floor(Math.random() * 5) + 2;
                    const people = Math.floor(Math.random() * 5) + 2;
                    return {
                        q: `把糖果分给${people}个小朋友，每人${each}颗，一共需要多少颗糖果？`,
                        a: each * people
                    };
                }
            },
            // 几个几
            {
                gen: () => {
                    const num = Math.floor(Math.random() * 6) + 2;
                    const times = Math.floor(Math.random() * 5) + 2;
                    return {
                        q: `${times}个${num}是多少？`,
                        a: num * times
                    };
                }
            },
            // 包含除法
            {
                gen: () => {
                    const each = Math.floor(Math.random() * 5) + 2;
                    const groups = Math.floor(Math.random() * 5) + 2;
                    const total = each * groups;
                    return {
                        q: `${total}里面有几个${each}？`,
                        a: groups
                    };
                }
            },
            // 等分除法
            {
                gen: () => {
                    const parts = Math.floor(Math.random() * 5) + 2;
                    const each = Math.floor(Math.random() * 6) + 2;
                    const total = parts * each;
                    return {
                        q: `把${total}平均分成${parts}份，每份是多少？`,
                        a: each
                    };
                }
            },
            // 比较倍数
            {
                gen: () => {
                    const base = Math.floor(Math.random() * 4) + 2;
                    const times = Math.floor(Math.random() * 3) + 2;
                    return {
                        q: `${base}的${times}倍是多少？`,
                        a: base * times
                    };
                }
            },
            // 腿的问题
            {
                gen: () => {
                    const chickens = Math.floor(Math.random() * 5) + 1;
                    return {
                        q: `${chickens}只小鸡有多少条腿？（小鸡有2条腿）`,
                        a: chickens * 2
                    };
                }
            },
            // 轮子问题
            {
                gen: () => {
                    const cars = Math.floor(Math.random() * 5) + 2;
                    return {
                        q: `${cars}辆小汽车一共有多少个轮子？（每辆车4个轮子）`,
                        a: cars * 4
                    };
                }
            },
            // 三角形边
            {
                gen: () => {
                    const triangles = Math.floor(Math.random() * 6) + 2;
                    return {
                        q: `${triangles}个三角形一共有多少条边？`,
                        a: triangles * 3
                    };
                }
            }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        const problem = t.gen();

        return {
            id: `word${Date.now()}`,
            question: problem.q,
            answer: problem.a,
            type: 'word',
            difficulty: 'medium'
        };
    }
}

// 保留旧函数兼容性
export function generateMathProblems(count: number = 5): MathProblem[] {
    const problems: MathProblem[] = [];
    for (let i = 0; i < count; i++) {
        problems.push(generateMathProblem());
    }
    return problems;
}

// 拼音练习数据 - 重点练习 ing, in, un, ün, en, eng, an, ang 等易混淆韵母
const PINYIN_DATA = [
    // ing vs in 对比
    { word: '星星', correct: 'xīng xīng', wrongs: ['xīn xīn', 'xīn xīng', 'xīng xīn'] },
    { word: '听见', correct: 'tīng jiàn', wrongs: ['tīn jiàn', 'tīng jìan', 'tīn jìan'] },
    { word: '心情', correct: 'xīn qíng', wrongs: ['xīng qíng', 'xīn qín', 'xīng qín'] },
    { word: '拼音', correct: 'pīn yīn', wrongs: ['pīng yīn', 'pīn yīng', 'pīng yīng'] },
    { word: '明亮', correct: 'míng liàng', wrongs: ['mín liàng', 'míng liàn', 'mín liàn'] },
    { word: '金鱼', correct: 'jīn yú', wrongs: ['jīng yú', 'jīn yǖ', 'jīng yǖ'] },
    { word: '青蛙', correct: 'qīng wā', wrongs: ['qīn wā', 'qīng wà', 'qīn wà'] },
    { word: '亲人', correct: 'qīn rén', wrongs: ['qīng rén', 'qīn réng', 'qīng réng'] },
    { word: '冰块', correct: 'bīng kuài', wrongs: ['bīn kuài', 'bīng kuāi', 'bīn kuāi'] },
    { word: '新年', correct: 'xīn nián', wrongs: ['xīng nián', 'xīn niáng', 'xīng niáng'] },

    // un vs ün 对比
    { word: '春天', correct: 'chūn tiān', wrongs: ['chǖn tiān', 'chūn tiàn', 'chǖn tiàn'] },
    { word: '云朵', correct: 'yún duǒ', wrongs: ['yūn duǒ', 'yún duō', 'yūn duō'] },
    { word: '军人', correct: 'jūn rén', wrongs: ['jǖn rén', 'jūn réng', 'jǖn réng'] },
    { word: '裙子', correct: 'qún zi', wrongs: ['qūn zi', 'qún zǐ', 'qūn zǐ'] },
    { word: '温暖', correct: 'wēn nuǎn', wrongs: ['wūn nuǎn', 'wēn nuàn', 'wūn nuàn'] },
    { word: '昆虫', correct: 'kūn chóng', wrongs: ['kǖn chóng', 'kūn chóng', 'kǖn chóng'] },

    // en vs eng 对比
    { word: '风筝', correct: 'fēng zheng', wrongs: ['fēn zheng', 'fēng zhèng', 'fēn zhèng'] },
    { word: '门口', correct: 'mén kǒu', wrongs: ['méng kǒu', 'mén kōu', 'méng kōu'] },
    { word: '朋友', correct: 'péng you', wrongs: ['pén you', 'péng yǒu', 'pén yǒu'] },
    { word: '认真', correct: 'rèn zhēn', wrongs: ['rèng zhēn', 'rèn zhēng', 'rèng zhēng'] },
    { word: '灯笼', correct: 'dēng long', wrongs: ['dēn long', 'dēng lóng', 'dēn lóng'] },
    { word: '本子', correct: 'běn zi', wrongs: ['běng zi', 'běn zǐ', 'běng zǐ'] },

    // an vs ang 对比
    { word: '蓝天', correct: 'lán tiān', wrongs: ['láng tiān', 'lán tiàn', 'láng tiàn'] },
    { word: '房间', correct: 'fáng jiān', wrongs: ['fán jiān', 'fáng jiàn', 'fán jiàn'] },
    { word: '班级', correct: 'bān jí', wrongs: ['bāng jí', 'bān jī', 'bāng jī'] },
    { word: '帮忙', correct: 'bāng máng', wrongs: ['bān máng', 'bāng mán', 'bān mán'] },
    { word: '山羊', correct: 'shān yáng', wrongs: ['shāng yáng', 'shān yán', 'shāng yán'] },
    { word: '糖果', correct: 'táng guǒ', wrongs: ['tán guǒ', 'táng guō', 'tán guō'] },

    // 其他易混淆
    { word: '老师', correct: 'lǎo shī', wrongs: ['lǎo sī', 'láo shī', 'láo sī'] },
    { word: '学校', correct: 'xué xiào', wrongs: ['xuě xiào', 'xué xiāo', 'xuě xiāo'] },
    { word: '作业', correct: 'zuò yè', wrongs: ['zuō yè', 'zuò yě', 'zuō yě'] },
    { word: '花朵', correct: 'huā duǒ', wrongs: ['huá duǒ', 'huā duō', 'huá duō'] },
    { word: '小鸟', correct: 'xiǎo niǎo', wrongs: ['xiǎo liǎo', 'xiāo niǎo', 'xiāo liǎo'] },
    { word: '月亮', correct: 'yuè liang', wrongs: ['yuě liang', 'yuè liàng', 'yuě liàng'] },
    { word: '太阳', correct: 'tài yáng', wrongs: ['tài yán', 'tāi yáng', 'tāi yán'] },
    { word: '草地', correct: 'cǎo dì', wrongs: ['cǎo dī', 'cāo dì', 'cāo dī'] },
    { word: '游泳', correct: 'yóu yǒng', wrongs: ['yóu yǒn', 'yōu yǒng', 'yōu yǒn'] },
    { word: '唱歌', correct: 'chàng gē', wrongs: ['chàn gē', 'chàng gě', 'chàn gě'] },
    { word: '跳舞', correct: 'tiào wǔ', wrongs: ['tiào wū', 'tiāo wǔ', 'tiāo wū'] },
    { word: '睡觉', correct: 'shuì jiào', wrongs: ['shuì jiāo', 'shuī jiào', 'shuī jiāo'] },
];

// 生成拼音练习题
export function generatePinyinProblem(): PinyinProblem {
    const item = PINYIN_DATA[Math.floor(Math.random() * PINYIN_DATA.length)];
    const options = [item.correct, ...item.wrongs].sort(() => Math.random() - 0.5);

    return {
        id: `pinyin${Date.now()}`,
        word: item.word,
        correctPinyin: item.correct,
        options,
        type: 'select'
    };
}

// 仿写句子数据 - 选择题模式（2选1）
// 优化：错误选项也包含关键词，但存在句式使用错误（如因果颠倒、搭配不当、逻辑错误等）
const SENTENCE_DATA = [
    // 1. "像"字句（比喻句）- 错误选项：比喻不恰当或本体喻体不搭配
    {
        pattern: '……像……',
        example: '弯弯的月亮像小小的船。',
        correct: '圆圆的太阳像一个大火球。',
        wrong: '圆圆的太阳像一条弯弯的小河。'  // 形状不匹配
    },
    {
        pattern: '……像……',
        example: '弯弯的月亮像小小的船。',
        correct: '树上的苹果像红红的灯笼。',
        wrong: '树上的苹果像绿绿的小草。'  // 颜色不匹配
    },
    {
        pattern: '……像……',
        example: '弯弯的月亮像小小的船。',
        correct: '平静的湖面像一面大镜子。',
        wrong: '平静的湖面像汹涌的大海。'  // 特征矛盾
    },
    {
        pattern: '……像……',
        example: '白白的云朵像棉花糖。',
        correct: '闪闪的星星像眼睛。',
        wrong: '闪闪的星星像黑黑的石头。'  // 特征不匹配
    },
    {
        pattern: '……像……',
        example: '弯弯的月亮像小小的船。',
        correct: '柳条像小姑娘的长辫子。',
        wrong: '柳条像笔直的电线杆。'  // 形态不匹配
    },

    // 2. "有的"排比句 - 错误选项：排比结构不完整或内容不协调
    {
        pattern: '……有的……有的……还有的……',
        example: '下课了，操场上真热闹，同学们有的跳绳，有的踢球，还有的做游戏。',
        correct: '公园里的菊花开了，有的是红的，有的是黄的，还有的是紫的。',
        wrong: '公园里的菊花开了，有的是红的，有的很香，还有的是紫的。'  // 并列内容不统一
    },
    {
        pattern: '……有的……有的……还有的……',
        example: '下课了，操场上真热闹，同学们有的跳绳，有的踢球，还有的做游戏。',
        correct: '大扫除时，同学们有的扫地，有的擦桌子，还有的倒垃圾。',
        wrong: '大扫除时，同学们有的扫地，有的很累，还有的倒垃圾。'  // 并列内容不统一
    },
    {
        pattern: '……有的……有的……还有的……',
        example: '下课了，操场上真热闹，同学们有的跳绳，有的踢球，还有的做游戏。',
        correct: '天上的云，有的像小羊，有的像棉花，还有的像城堡。',
        wrong: '天上的云，有的像小羊，有的在飘动，还有的像城堡。'  // 并列内容不统一
    },

    // 3. "一边"并列句 - 错误选项：两个动作无法同时进行
    {
        pattern: '……一边……一边……',
        example: '妈妈一边洗衣服，一边哼着歌。',
        correct: '老师一边讲课，一边在黑板上写字。',
        wrong: '老师一边睡觉，一边在黑板上写字。'  // 无法同时进行
    },
    {
        pattern: '……一边……一边……',
        example: '妈妈一边洗衣服，一边哼着歌。',
        correct: '我一边看书，一边思考问题。',
        wrong: '我一边看书，一边闭着眼睛。'  // 无法同时进行
    },
    {
        pattern: '……一边……一边……',
        example: '爸爸一边看报纸，一边喝茶。',
        correct: '小明一边走路，一边唱歌。',
        wrong: '小明一边走路，一边躺在床上。'  // 无法同时进行
    },
    {
        pattern: '……一边……一边……',
        example: '妈妈一边洗衣服，一边哼着歌。',
        correct: '爷爷一边散步，一边听广播。',
        wrong: '爷爷一边散步，一边坐在椅子上。'  // 无法同时进行
    },

    // 4. "一……就……" - 错误选项：前后顺序颠倒或因果不成立
    {
        pattern: '……一……就……',
        example: '他一回到家就写作业。',
        correct: '太阳一出来，雪就化了。',
        wrong: '雪一化了，太阳就出来。'  // 因果颠倒
    },
    {
        pattern: '……一……就……',
        example: '他一回到家就写作业。',
        correct: '铃声一响，同学们就跑出了教室。',
        wrong: '同学们一跑出教室，铃声就响了。'  // 因果颠倒
    },
    {
        pattern: '……一……就……',
        example: '他一回到家就写作业。',
        correct: '妈妈一叫我，我就过去了。',
        wrong: '我一过去，妈妈就叫我。'  // 因果颠倒
    },
    {
        pattern: '……一……就……',
        example: '他一回到家就写作业。',
        correct: '天一黑，路灯就亮了。',
        wrong: '路灯一亮，天就黑了。'  // 因果颠倒
    },

    // 5. "因为……所以……" - 错误选项：因果关系颠倒或不成立
    {
        pattern: '因为……所以……',
        example: '因为今天下雨，所以我们取消了体育课。',
        correct: '因为小明生病了，所以他今天没来上学。',
        wrong: '因为小明今天没来上学，所以他生病了。'  // 因果颠倒
    },
    {
        pattern: '因为……所以……',
        example: '因为今天下雨，所以我们取消了体育课。',
        correct: '因为他学习很刻苦，所以取得了第一名。',
        wrong: '因为他取得了第一名，所以学习很刻苦。'  // 因果颠倒
    },
    {
        pattern: '因为……所以……',
        example: '因为今天下雨，所以我们取消了体育课。',
        correct: '因为天气很冷，所以我穿上了棉袄。',
        wrong: '因为我穿上了棉袄，所以天气很冷。'  // 因果颠倒
    },
    {
        pattern: '因为……所以……',
        example: '因为今天下雨，所以我们取消了体育课。',
        correct: '因为路上结冰了，所以爸爸开车很慢。',
        wrong: '因为爸爸开车很慢，所以路上结冰了。'  // 因果颠倒
    },
    {
        pattern: '因为……所以……',
        example: '因为今天下雨，所以我们取消了体育课。',
        correct: '因为小红帮助了我，所以我很感谢她。',
        wrong: '因为今天是星期一，所以苹果很甜。'  // 因果不成立
    },

    // 6. "多么"感叹句 - 错误选项：感叹词使用不当或搭配错误
    {
        pattern: '……多么……多么……',
        example: '我们的祖国多么广大，多么美丽！',
        correct: '天空的云朵多么洁白，多么柔软！',
        wrong: '天空的云朵多么洁白，多么坚硬！'  // 搭配矛盾
    },
    {
        pattern: '……多么……多么……',
        example: '我们的祖国多么广大，多么美丽！',
        correct: '这里的空气多么清新，花儿多么鲜艳！',
        wrong: '这里的空气多么清新，垃圾多么臭！'  // 感情色彩不一致
    },
    {
        pattern: '……多么……多么……',
        example: '我们的祖国多么广大，多么美丽！',
        correct: '春天的公园多么热闘，多么美丽！',
        wrong: '春天的公园多么安静，多么吵闹！'  // 自相矛盾
    },

    // 7. "……极了" - 错误选项：程度词搭配不当
    {
        pattern: '……极了',
        example: '听到这个消息，他高兴极了。',
        correct: '今天的西瓜甜极了。',
        wrong: '今天的西瓜方极了。'  // 搭配不当
    },
    {
        pattern: '……极了',
        example: '听到这个消息，他高兴极了。',
        correct: '公园里的风景美极了。',
        wrong: '公园里的风景跑极了。'  // 搭配不当
    },
    {
        pattern: '……极了',
        example: '听到这个消息，他高兴极了。',
        correct: '这个问题难极了。',
        wrong: '这个问题桌子极了。'  // 搭配不当
    },
    {
        pattern: '……极了',
        example: '听到这个消息，他高兴极了。',
        correct: '妹妹的舞跳得棒极了。',
        wrong: '妹妹的舞跳得椅子极了。'  // 搭配不当
    },

    // 8. "到底"问句 - 错误选项：疑问语气不完整或用法错误
    {
        pattern: '……到底……',
        example: '大象到底有多重呢？',
        correct: '雨到底什么时候才会停呢？',
        wrong: '雨到底已经停了。'  // 不是疑问句
    },
    {
        pattern: '……到底……',
        example: '大象到底有多重呢？',
        correct: '这本书到底是谁丢的呢？',
        wrong: '这本书到底是小明丢的。'  // 不是疑问句
    },
    {
        pattern: '……到底……',
        example: '大象到底有多重呢？',
        correct: '你到底想吃什么呢？',
        wrong: '你到底想吃苹果。'  // 不是疑问句
    },

    // 9. 拟人句 - 错误选项：没有赋予人的特征
    {
        pattern: '拟人句（把物体当人写）',
        example: '小草从地下探出头来。',
        correct: '小鸟在树枝上唱歌。',
        wrong: '小鸟在树枝上飞来飞去。'  // 没有拟人
    },
    {
        pattern: '拟人句（把物体当人写）',
        example: '小草从地下探出头来。',
        correct: '风儿轻轻地抚摸着我的脸庞。',
        wrong: '风儿轻轻地吹过我的脸庞。'  // 没有拟人
    },
    {
        pattern: '拟人句（把物体当人写）',
        example: '小草从地下探出头来。',
        correct: '星星在天空中眨眼睛。',
        wrong: '星星在天空中一闪一闪。'  // 没有拟人
    },
    {
        pattern: '拟人句（把物体当人写）',
        example: '小草从地下探出头来。',
        correct: '花儿在风中跳舞。',
        wrong: '花儿在风中摇摆。'  // 没有拟人
    },
    {
        pattern: '拟人句（把物体当人写）',
        example: '小草从地下探出头来。',
        correct: '太阳公公露出了笑脸。',
        wrong: '太阳从云层中出来了。'  // 没有拟人
    },

    // 10. "越……越……" - 错误选项：变化方向矛盾或不合逻辑
    {
        pattern: '……越……越……',
        example: '雨越下越大。',
        correct: '飞机越飞越高。',
        wrong: '飞机越飞越矮。'  // 用词不当（应该是"低"）
    },
    {
        pattern: '……越……越……',
        example: '雨越下越大。',
        correct: '天气越来越冷了。',
        wrong: '天气越来越冷热了。'  // 矛盾
    },
    {
        pattern: '……越……越……',
        example: '雨越下越大。',
        correct: '我们离终点越来越近了。',
        wrong: '我们越走离终点越远了。'  // 逻辑不通（走向终点应该越来越近）
    },
    {
        pattern: '……越……越……',
        example: '雨越下越大。',
        correct: '弟弟越长越高了。',
        wrong: '弟弟越长越老了。'  // 搭配不当
    },

    // 11. "虽然……但是……" - 转折关系
    {
        pattern: '虽然……但是……',
        example: '虽然今天很冷，但是我还是去上学了。',
        correct: '虽然这道题很难，但是我做出来了。',
        wrong: '虽然这道题很难，但是我不会做。'  // 没有转折
    },
    {
        pattern: '虽然……但是……',
        example: '虽然今天很冷，但是我还是去上学了。',
        correct: '虽然他个子矮，但是跑得很快。',
        wrong: '虽然他个子矮，但是他不高。'  // 没有转折
    },

    // 12. "不但……而且……" - 递进关系
    {
        pattern: '不但……而且……',
        example: '小明不但学习好，而且体育也很棒。',
        correct: '这本书不但有趣，而且很有意义。',
        wrong: '这本书不但有趣，而且不好看。'  // 递进方向错误
    },
    {
        pattern: '不但……而且……',
        example: '小明不但学习好，而且体育也很棒。',
        correct: '妈妈不但会做饭，而且做得很好吃。',
        wrong: '妈妈不但会做饭，而且不会炒菜。'  // 递进方向错误
    },

    // 13. "如果……就……" - 假设关系
    {
        pattern: '如果……就……',
        example: '如果明天下雨，我们就不去公园了。',
        correct: '如果你认真学习，就能取得好成绩。',
        wrong: '如果你认真学习，就会考不好。'  // 假设结果矛盾
    },
    {
        pattern: '如果……就……',
        example: '如果明天下雨，我们就不去公园了。',
        correct: '如果我有一双翅膀，就能飞上天空。',
        wrong: '如果我有一双翅膀，就不能飞了。'  // 假设结果矛盾
    },
];

// 生成仿写句子练习（选择题）
export function generateSentenceProblem(): SentenceProblem {
    const item = SENTENCE_DATA[Math.floor(Math.random() * SENTENCE_DATA.length)];
    // 随机排列选项顺序
    const options = Math.random() > 0.5
        ? [item.correct, item.wrong]
        : [item.wrong, item.correct];

    return {
        id: `sentence${Date.now()}`,
        example: item.example,
        pattern: item.pattern,
        correctAnswer: item.correct,
        options
    };
}
