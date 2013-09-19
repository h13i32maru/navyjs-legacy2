#include "jobject.h"

#include <QFile>

JObject::JObject()
{
}

JObject::JObject(QJsonValue value)
{
    mRootValue = value;
}

void JObject::parse(QByteArray byteArray)
{
    QJsonDocument doc = QJsonDocument::fromJson(byteArray);
    if (doc.isArray()) {
        mRootValue = QJsonValue(doc.array());
    } else {
        mRootValue = QJsonValue(doc.object());
    }
}

bool JObject::parseFromFilePath(QString filePath)
{
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        return false;
    }
    this->parse(file.readAll());
    file.close();
    return true;
}

QByteArray JObject::stringify()
{
    QJsonDocument doc;
    if (mRootValue.isArray()) {
        doc = QJsonDocument(mRootValue.toArray());
    } else {
        doc = QJsonDocument(mRootValue.toObject());
    }

    return doc.toJson();
}

int JObject::length()
{
    if (mRootValue.isArray()) {
        return mRootValue.toArray().size();
    } else {
        return 0;
    }
}

void JObject::clear() {
    if (mRootValue.isArray()) {
        mRootValue = QJsonValue(QJsonArray());
    } else {
        mRootValue = QJsonValue(QJsonObject());
    }
}

int JObject::getInt(QString keysStr)
{
    return (int) get(mRootValue, keysStr).toDouble();
}

QString JObject::getStr(QString keysStr)
{
    return get(mRootValue, keysStr).toString();
}

JObject JObject::getObject(QString keysStr)
{
    QJsonValue value = get(mRootValue, keysStr);
    return JObject(value);
}

QJsonValue JObject::get(QJsonValue value, QString keysStr)
{
    QStringList keys = keysStr.split(".");
    QString key = keys[0];
    int index = key.toInt();
    QJsonValue nextValue;

    if (value.isArray()) {
        nextValue = value.toArray()[index];
    } else if (value.isObject()) {
        nextValue = value.toObject()[key];
    }

    if (keys.size() == 1) {
        return nextValue;
    } else {
        keys.pop_front();
        return get(nextValue, keys.join("."));
    }
}

void JObject::set(QString keysStr, int value)
{
    mRootValue = set(mRootValue, keysStr, QJsonValue(value));
}

void JObject::set(QString keysStr, QString value)
{
    mRootValue = set(mRootValue, keysStr, QJsonValue(value));
}

QJsonValue JObject::set(QJsonValue parentValue, QString keysStr, QJsonValue value)
{
    QStringList keys = keysStr.split(".");
    QString key = keys[0];
    int index = key.toInt();

    if (keys.size() == 1) {
        if (parentValue.isArray()) {
            QJsonArray array = parentValue.toArray();
            array[index] = value;
            return QJsonValue(array);
        } else {
            QJsonObject object = parentValue.toObject();
            object[key] = value;
            return QJsonValue(object);
        }
    } else {
        keys.pop_front();
        if (parentValue.isArray()) {
            QJsonArray array= parentValue.toArray();
            QJsonValue newValue = set(QJsonValue(array[index]), keys.join("."), value);
            if (array.size() <= index) {
                array.insert(index, newValue);
            } else {
                array[index] = newValue;
            }
            return QJsonValue(array);
        } else {
            QJsonObject object = parentValue.toObject();
            object[key] = set(QJsonValue(parentValue.toObject()[key]), keys.join("."), value);
            return QJsonValue(object);
        }
    }
}
