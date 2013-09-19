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

    void parse(QByteArray byteArray);
    QByteArray stringify();

    // getter
    int getInt(QString keysStr);
    QString getStr(QString keysStr);

    // setter
    void set(QString keysStr, int value);

private:
    QJsonValue mRootValue;
    QJsonValue get(QJsonValue value, QString keysStr);
    QJsonValue set(QJsonValue parentValue, QString keysStr, QJsonValue value);
};

#endif // JOBJECT_H
