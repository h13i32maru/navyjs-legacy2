#ifndef JOBJECT_H
#define JOBJECT_H

#include <QStringList>
#include <QJsonObject>
#include <QJsonArray>
#include <QJsonDocument>

class JObject
{
public:
    JObject();
    JObject(QJsonValue value);

    void parse(QByteArray byteArray);
    bool parseFromFilePath(QString filePath);
    QByteArray stringify();
    int length();
    void clear();

    // getter
    int getInt(QString keysStr);
    QString getStr(QString keysStr);
    JObject getObject(QString keysStr);

    // setter
    void set(QString keysStr, int value);
    void set(QString keysStr, QString value);

private:
    QJsonValue mRootValue;
    QJsonValue get(QJsonValue value, QString keysStr);
    QJsonValue set(QJsonValue parentValue, QString keysStr, QJsonValue value);
};

#endif // JOBJECT_H
