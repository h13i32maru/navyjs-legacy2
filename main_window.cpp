#include "main_window.h"
#include "ui_main_window.h"
#include "n_util.h"

#include <QFileDialog>
#include <QDebug>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    ui->topTabWidget->setEnabled(false);
    mProjectDir = new QDir(QDir::homePath());
}

void MainWindow::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    ui->topTabWidget->setEnabled(true);

    ui->nConfigWidget->setCurrentProject(dirPath);
    ui->nCodeWidget->setCurrentProject(dirPath);
    ui->nImageWidget->setCurrentProject(dirPath);
    ui->nLayoutWidget->setCurrentProject(dirPath);
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

    NUtil::copyDir(":/template", dirName);
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

void MainWindow::saveAll() {
    if (mProjectName.isEmpty()) {
        return;
    }

    ui->nConfigWidget->saveConfig();
    ui->nCodeWidget->saveAllFile();
    ui->nLayoutWidget->saveAllFile();
}

MainWindow::~MainWindow()
{
    delete ui;
}
