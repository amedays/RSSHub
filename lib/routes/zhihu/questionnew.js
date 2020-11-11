const got = require('@/utils/got');
const utils = require('./utils');

module.exports = async (ctx) => {
    const questionId = ctx.params.questionId;
    const sort = 'created';
    let listRes = [];
    var include = `data[*].content.excerpt&limit=1&offset=0`;
    var url = `https://www.zhihu.com/api/v4/questions/${questionId}/answers?include=${include}&sort_by=${sort}`;
    let response = await got({
        method: 'get',
        url,
        headers: {
            ...utils.header,
            Referer: `https://www.zhihu.com/question/${questionId}`,
            Authorization: 'oauth c3cef7c66a1843f8b3a9e6a1e3160e20', // hard-coded in js
        }
    });

    let limit = ctx.params.limit ? ctx.params.limit : response.data.paging.totals;
    if (limit > 20) {
        let offset = 0;
        while (limit > 0) {
            var include = `data[*].content.excerpt&limit=20&offset=${offset}`;
            var url = `https://www.zhihu.com/api/v4/questions/${questionId}/answers?include=${include}&sort_by=${sort}`;
            response = await got({
                method: 'get',
                url,
                headers: {
                    ...utils.header,
                    Referer: `https://www.zhihu.com/question/${questionId}`,
                    Authorization: 'oauth c3cef7c66a1843f8b3a9e6a1e3160e20', // hard-coded in js
                },
            });
            listRes = listRes.concat(response.data.data);
            offset += 20;
            limit -= 20;
        }
    }


    ctx.state.data = {
        title: `知乎-${listRes[0].question.title}`,
        link: `https://www.zhihu.com/question/${questionId}`,
        item: listRes.map((item) => {
            const title = `${item.author.name}的回答：${item.excerpt}`;
            const description = `${item.author.name}的回答<br/><br/>${utils.ProcessImage(item.content)}`;

            return {
                title,
                description,
                author: item.author.name,
                pubDate: new Date(item.updated_time * 1000).toUTCString(),
                guid: item.id.toString(),
                link: `https://www.zhihu.com/question/${questionId}/answer/${item.id}`,
            };
        }),
    };
};
