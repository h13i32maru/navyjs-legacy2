#include "main_window.h"
#include "ui_main_window.h"
#include "n_util.h"
#include "n_exec_widget.h"

#include <QFileDialog>
#include <QDebug>
#include <QScreen>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    ui->topTabWidget->setEnabled(false);
    mProjectDir = new QDir(QDir::homePath());

    mExecWidget = new NExecWidget(this);

    connect(ui->actionNewProject, SIGNAL(triggered(bool)), this, SLOT(newProject()));
    connect(ui->actionOpenProject, SIGNAL(triggered(bool)), this, SLOT(openProject()));
    connect(ui->actionSaveAll, SIGNAL(triggered(bool)), this, SLOT(saveAll()));
    connect(ui->actionExec, SIGNAL(triggered(bool)), this, SLOT(execNavy()));
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

void MainWindow::execNavy() {
    if (mProjectName.isEmpty()) {
        return;
    }

    mExecWidget->loadFile(mProjectDir->absoluteFilePath("index.html"));
    mExecWidget->activateWindow();
    mExecWidget->raise();
    mExecWidget->show();
}

MainWindow::~MainWindow()
{
    delete ui;
}
