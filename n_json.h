#ifndef N_JSON_H
#define N_JSON_H

#include <QStringList>
#include <QJsonObject>
#include <QJsonArray>
#include <QJsonDocument>
#include <QVariant>

class NJson
{
public:
    NJson();
    NJson(QJsonValue value);

    void parse(QByteArray byteArray);
    void parse(const QString &jsonText);
    bool parseFromFilePath(QString filePath);
    QByteArray stringify();
    int length();
    void clear();
    QVariant toVariant();

    // getter
    int getInt(const QString &keysStr) const;
    QString getStr(const QString &keysStr) const;
    NJson getObject(const QString &keysStr) const;

    // setter
    void set(QString keysStr, int value);
    void set(QString keysStr, QString value);

private:
    QJsonValue mRootValue;
    QJsonValue get(const QJsonValue &value, const QString &keysStr) const;
    QJsonValue set(QJsonValue parentValue, QString keysStr, QJsonValue value);
};

#endif // N_JSON_H
