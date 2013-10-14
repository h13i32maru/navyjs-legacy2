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
    NJson(const QString &jsonText);

    void parse(QByteArray byteArray);
    void parse(const QString &jsonText);
    bool parseFromFilePath(QString filePath);
    QByteArray stringify();
    int length() const;
    void clear();
    QVariant toVariant();

    // getter
    int getInt(const QString &keysStr) const;
    QString getStr(const QString &keysStr) const;
    NJson getObject(const QString &keysStr) const;

    // setter
    void set(QString keysStr, int value);
    void set(QString keysStr, QString value);

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
