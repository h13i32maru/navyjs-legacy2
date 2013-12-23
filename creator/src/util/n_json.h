#ifndef N_JSON_H
#define N_JSON_H

#include <QStringList>
#include <QJsonObject>
#include <QJsonArray>
#include <QJsonDocument>
#include <QVariant>

/**
 * JSONを簡単に扱うためのクラス.
 * (効率が悪い方法になっていると思うので、速度が問題になってきたら内部を改良すべき)
 *
 * @example
 * NJson json;
 * json.parseFromFilePath("foo.json"); //{id: "abc", detail: {title: "foo"}}
 * QString id = json.getStr("id");
 * QString title = json.getStr("detail.title");
 *
 * @example
 * NJson json;
 * json.parseFromFilePath("bar.json"); // [{num: 10}, {num: 20}]
 * int num = json.getInt("0.num");
 * json.set(QString::number(json.length()) + ".num", 100);
 */

class NJson
{
public:
    NJson();
    NJson(QJsonValue value);
    NJson(const QString &jsonText);

    void parse(QByteArray byteArray);
    void parse(const QString &jsonText);
    bool parseFromFilePath(QString filePath);
    bool writeToFile(const QString &filePath) const;
    QByteArray stringify() const;
    int length() const;
    void clear();
    QVariant toVariant();

    // getter
    bool getBool(const QString &keysStr) const;
    int getInt(const QString &keysStr) const;
    QString getStr(const QString &keysStr) const;
    NJson getObject(const QString &keysStr) const;

    // setter
    void set(QString keysStr, bool value);
    void set(QString keysStr, int value);
    void set(QString keysStr, QString value);
    void set(QString keysStr, NJson value);

    void remove(const QString &keysStr);

    int searchValue(const QString &key, const QString &value);
    int countValue(const QString &key, const QString &value);
private:
    QJsonValue mRootValue;
    QJsonValue get(const QJsonValue &value, const QString &keysStr) const;
    QJsonValue set(QJsonValue parentValue, QString keysStr, QJsonValue value);
    QJsonValue remove(QJsonValue parentValue, const QString &keysStr);
};

#endif // N_JSON_H
