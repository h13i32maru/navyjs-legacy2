#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "jobject.h"
#include <QMainWindow>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    static bool cpDir(const QString &srcPath, const QString &dstPath);

    static QJsonValue jsonValue(QJsonObject object, QString keys);
    static int jsonInt(QJsonObject object, QString keys);
    static QString jsonStr(QJsonObject object, QString keys);
    static QJsonObject setValue(QJsonObject obj, QString keyStr, QJsonValue value);

    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

private:
    Ui::MainWindow *ui;
    JObject mConfigApp;

private slots:
    void newProject();
    void updateConfigAppEditText();
};

#endif // MAIN_WINDOW_H
