import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { NewsAggregationApp } from "../../NewsAggregationApp";
import { NewsItem } from "../../definitions/NewsItem";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { INewsSourceAdapter } from "../INewsSourceAdapter";
import { NewsItemPersistence } from "../../persistence/NewsItemPersistence";

export class TechCrunchAdapter implements INewsSourceAdapter {
    app: NewsAggregationApp;
    newsItems: NewsItem[] = [];
    fetchUrl: string = `https://techcrunch.com/wp-json/wp/v2/posts`;

    public async fetchNews(
        read: IRead,
        modify: IModify,
        room: IRoom,
        http: IHttp,
        persis: IPersistence,
    ): Promise<NewsItem[]> {
        try {
            const response = await http.get(this.fetchUrl);

            console.log("Res:", response.data, "Done");

            this.newsItems = response?.data?.map((newsItem) => ({
                title: newsItem.yoast_head_json.title,
                description: newsItem.yoast_head_json.description,
                link: newsItem.link,
                image: newsItem.jetpack_featured_media_url,
                source: "TechCrunch",
                author: newsItem.yoast_head_json.author,
                publishedAt: new Date(newsItem.date),
            }));
            console.log("NewsItems:", this.newsItems);
        } catch (err) {
            console.error(err); // for development purposes
            this.app.getLogger().error(err);
        }

        return this.newsItems;
    }

    public async saveNews(
        read: IRead,
        modify: IModify,
        room: IRoom,
        http: IHttp,
        persistence: IPersistence,
        persistenceRead: IPersistenceRead,
    ): Promise<any> {
        const newsStorage = new NewsItemPersistence(
            this.app,
            persistence,
            persistenceRead,
        );

        try {
            for (const news of this.newsItems) {
                await newsStorage.saveNews(news);
            }
            console.log("all news-items saved");
        } catch (err) {
            console.error("News Items could not be save", err);
            this.app.getLogger().error("News Items could not be save", err);
        }
    }
}
