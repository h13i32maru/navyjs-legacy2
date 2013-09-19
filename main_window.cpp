#include "main_window.h"
#include "ui_main_window.h"

#include <QDir>
#include <QFileInfo>
#include <QDebug>
#include <QFileDialog>
#include <QJsonDocument>
#include <QJsonObject>
#include <QMessageBox>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    ui->topTabWidget->setEnabled(false);
    mProjectDir = new QDir(QDir::homePath());
}

void MainWindow::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();
    mConfigPage.parseFromFilePath(mProjectDir->absoluteFilePath("config/page.json"));

    // app.json
    mConfigApp.parseFromFilePath(mProjectDir->absoluteFilePath("config/app.json"));
    ui->appSizeWidth->setValue(mConfigApp.getInt("size.width"));
    ui->appSizeHeight->setValue(mConfigApp.getInt("size.height"));
    ui->appStartScene->setText(mConfigApp.getStr("start.scene"));

    // scene.json
    mConfigScene.parseFromFilePath(mProjectDir->absoluteFilePath("config/scene.json"));
    QList<QTreeWidgetItem *> items;
    for (int i = 0; i < mConfigScene.length(); i++) {
        JObject scene = mConfigScene.getObject(QString::number(i));
        QStringList row;
        row.append(scene.getStr("id"));
        row.append(scene.getStr("class"));
        row.append(scene.getStr("classFile"));
        row.append(scene.getStr("extra.contentLayoutFile"));
        row.append(scene.getStr("extra.page"));
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(item->flags() | Qt::ItemIsEditable);
        items.append(item);
    }
    ui->sceneConfigTreeWidget->clear();
    ui->sceneConfigTreeWidget->addTopLevelItems(items);

    ui->topTabWidget->setEnabled(true);
}

void MainWindow::newProject()
{
    QString dirName = QFileDialog::getSaveFileName(this, tr("New Project"), QDir::homePath() + "/Desktop");

    if (dirName.isEmpty()) {
        return;
    }

    //FIXME: remove this code.
    if (QFile::exists(dirName)) {
        if (!QDir(dirName).removeRecursively()){
            return;
        }
    }

    cpDir(":/template", dirName);
    setCurrentProject(dirName);
//    ui->webView->load(QUrl("file://" + projectDir->absoluteFilePath("index.html")));

}

void MainWindow::openProject() {
    QString dirName = QFileDialog::getExistingDirectory(this, tr("Open Project"), QDir::homePath() + "/Desktop");

    if (dirName.isEmpty()) {
        return;
    }

    if (!QFile::exists(dirName)) {
        return;
    }

    setCurrentProject(dirName);
}

void MainWindow::updateConfigAppEditText() {
    mConfigApp.set("size.width", ui->appSizeWidth->value());
    mConfigApp.set("test.0.aaa", ui->appSizeWidth->value());
    ui->appConfigTextEdit->setText(mConfigApp.stringify());
}

void MainWindow::updateConfigScene(QTreeWidgetItem *item, int /* columnIndex */){
    int rowIndex = ui->sceneConfigTreeWidget->indexOfTopLevelItem(item);

    mConfigScene.set(rowIndex + ".id", item->text(0));
    mConfigScene.set(rowIndex + ".class", item->text(1));
    mConfigScene.set(rowIndex + ".classFile", item->text(2));
    mConfigScene.set(rowIndex + ".extra.contentLayoutFile", item->text(3));
    mConfigScene.set(rowIndex + ".extra.page", item->text(4));

    ui->sceneConfigTextEdit->setText(mConfigScene.stringify());
}

void MainWindow::saveConfig() {
    if (mProjectName.isEmpty()) {
        return;
    }

    // app.json
    QFile configAppFile(this->mProjectDir->absoluteFilePath("config/app.json"));
    if (!configAppFile.open(QIODevice::ReadWrite | QIODevice::Text)) {
        return;
    }
    configAppFile.write(this->mConfigApp.stringify());

    // scene.json
    QFile configSceneFile(this->mProjectDir->absoluteFilePath("config/scene.json"));
    if (!configSceneFile.open(QIODevice::ReadWrite | QIODevice::Text)) {
        return;
    }
    configSceneFile.write(this->mConfigScene.stringify());
}

void MainWindow::newScene() {
    int count = ui->sceneConfigTreeWidget->topLevelItemCount();
    QString suffix = QString::number(count);
    QStringList row;
    row.append("Scene" + suffix); //id
    row.append("Scene" + suffix); //class
    row.append("code/scene" + suffix + ".js"); //class file
    row.append("layout/scene" + suffix + ".json"); //layout file
    row.append("Page"); //page
    QTreeWidgetItem *item = new QTreeWidgetItem(row);
    item->setFlags(item->flags() | Qt::ItemIsEditable);
    ui->sceneConfigTreeWidget->insertTopLevelItem(count, item);
}

void MainWindow::removeScene() {
    QList<QTreeWidgetItem *> selectedItems = ui->sceneConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    QMessageBox msgBox;
    msgBox.setText(tr("Do you remove scene?"));
    msgBox.setInformativeText(item->text(0));
    msgBox.setStandardButtons(QMessageBox::Ok | QMessageBox::Cancel);
    msgBox.setDefaultButton(QMessageBox::Cancel);
    int ret = msgBox.exec();
    if (ret == QMessageBox::Ok) {
        ui->sceneConfigTreeWidget->takeTopLevelItem(ui->sceneConfigTreeWidget->indexOfTopLevelItem(item));
    }
}

void MainWindow::contextMenuForConfigScene(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Scene"), this, SLOT(newScene()));
    menu.addAction(tr("&Remove Scene"), this, SLOT(removeScene()));
    menu.exec(QCursor::pos());
}

MainWindow::~MainWindow()
{
    delete ui;
}

bool MainWindow::cpDir(const QString &srcPath, const QString &dstPath)
{
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
            QFile::setPermissions(dstItemPath, QFile::WriteOwner | QFile::permissions(dstItemPath));
        } else {
            qDebug() << "Unhandled item" << info.filePath() << "in cpDir";
        }
    }
    return true;
}
