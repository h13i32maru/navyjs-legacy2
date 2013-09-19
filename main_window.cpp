#include "main_window.h"
#include "ui_main_window.h"

#include <QDir>
#include <QFileInfo>
#include <QDebug>
#include <QFileDialog>
#include <QJsonDocument>
#include <QJsonObject>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
}

MainWindow::~MainWindow()
{
    delete ui;
}

bool MainWindow::cpDir(const QString &srcPath, const QString &dstPath)
{
//    rmDir(dstPath);
    QDir parentDstDir(QFileInfo(dstPath).path());
    if (!parentDstDir.mkdir(QFileInfo(dstPath).fileName()))
        return false;

    QDir srcDir(srcPath);
    foreach(const QFileInfo &info, srcDir.entryInfoList(QDir::Dirs | QDir::Files | QDir::NoDotAndDotDot)) {
        QString srcItemPath = srcPath + "/" + info.fileName();
        QString dstItemPath = dstPath + "/" + info.fileName();
        if (info.isDir()) {
            if (!cpDir(srcItemPath, dstItemPath)) {
                return false;
            }
        } else if (info.isFile()) {
            if (!QFile::copy(srcItemPath, dstItemPath)) {
                return false;
            }
        } else {
            qDebug() << "Unhandled item" << info.filePath() << "in cpDir";
        }
    }
    return true;
}

void MainWindow::newProject()
{
    QString dirName = QFileDialog::getSaveFileName(this);
    if (dirName.isEmpty() || QFile::exists(dirName)) {
        return;
    }

    cpDir(":/template", dirName);
    QDir *projectDir = new QDir(dirName);

    // ****** read app.json ************
    QFile configAppFile(projectDir->absoluteFilePath("config/app.json"));
    if (!configAppFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
        return;
    }
    //QJsonDocument configApp = QJsonDocument::fromJson(configAppFile.readAll());
    mConfigApp.parse(configAppFile.readAll());

    int width = mConfigApp.getInt("size.width");
    int height = mConfigApp.getInt("size.height");
    QString scene = mConfigApp.getStr("start.scene");

    ui->appSizeWidth->setValue(width);
    ui->appSizeHeight->setValue(height);
    ui->appStartScene->setText(scene);

    mConfigApp.set("size.width", 999);
    qDebug() << mConfigApp.getInt("size.width");
    qDebug() << mConfigApp.getInt("size.height");
    qDebug() << mConfigApp.getStr("start.scene");
    qDebug() << mConfigApp.getInt("test.0.aaa");
    qDebug() << mConfigApp.getInt("test.1.aaa");
    qDebug() << mConfigApp.stringify();

//    ui->webView->load(QUrl("file://" + projectDir->absoluteFilePath("index.html")));
}

void MainWindow::updateConfigAppEditText() {
    mConfigApp.set("size.width", ui->appSizeWidth->value());
    mConfigApp.set("test.0.aaa", ui->appSizeWidth->value());
    ui->appConfigTextEdit->setText(mConfigApp.stringify());
}
